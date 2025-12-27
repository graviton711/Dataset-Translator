import os
import traceback
import time
import random
import concurrent.futures
from deep_translator import GoogleTranslator

class TranslationService:
    def __init__(self):
        print("TranslationService initialized.")

    def initialize(self):
        # No specific initialization needed for deep-translator
        pass

    def translate_text_with_retry(self, text, retries=5, custom_patterns=None):
        """
        Translates a single text block with retry logic and smart splitting.
        Thread-safe: Creates its own Translator instance.
        """
        if not text or not text.strip():
            return text

        # Lazy import
        from text_preprocessor import TextPreprocessor 

        # 1. Split text
        segments = TextPreprocessor.split(text, custom_patterns)
        final_translated_text = ""
        
        # Create a dedicated translator for this thread/task
        translator = GoogleTranslator(source='auto', target='vi')

        for segment in segments:
            content = segment['content']
            
            # Skip non-text or empty
            if segment['type'] == 'non_text':
                final_translated_text += content
                continue
            if not content.strip():
                final_translated_text += content
                continue

            # Retry loop for the segment
            segment_translated = False
            for attempt in range(retries):
                try:
                    # Add a tiny jitter
                    time.sleep(random.uniform(0.1, 0.5))
                    
                    result = translator.translate(content)
                    final_translated_text += result
                    segment_translated = True
                    break
                except Exception as e:
                    # print(f"Retry {attempt+1}/{retries} for segment: {e}")
                    if attempt < retries - 1:
                        sleep_time = (2 ** attempt) + random.uniform(0, 1)
                        time.sleep(sleep_time)
                    else:
                        # Final attempt failed, keep original
                        final_translated_text += content
        
        return final_translated_text

    def run_translation_task(self, task_id, df, rows, columns, dataset_id=None):
        """
        Runs the translation task using a ThreadPool for maximum speed.
        Writes results to Firebase if dataset_id is provided.
        """
        from progress_tracker import progress_tracker
        from firebase_service import firebase_service
        import time

        # Fetch Glossary
        glossary = firebase_service.get_glossary()
        pre_glossary = {item['term']: item['translation'] for item in glossary if item.get('type') == 'pre'}
        post_glossary = {item['term']: item['translation'] for item in glossary if item.get('type') == 'post'}

        # Fetch Protected Patterns
        protected_patterns = firebase_service.get_protected_patterns()

        # Calculate total work
        work_items = []
        for row_idx in rows:
            for col in columns:
                # Only add if valid
                if row_idx < len(df) and col in df.columns:
                    val = str(df.at[row_idx, col])
                    if val.strip():
                        work_items.append((row_idx, col, val))

        total_items = len(work_items)
        progress_tracker.init_task(task_id, total_items)
        
        print(f"Starting task {task_id} with {total_items} items. Using Multi-threading.")

        task_state = progress_tracker.get_task(task_id)
        start_index = 0
        if task_state and task_state.get("current_index", 0) > 0:
            start_index = task_state["current_index"]
            print(f"Resuming task {task_id} from index {start_index}")

        # Configuration
        MAX_WORKERS = 8 
        processed_count = start_index
        CHUNK_SIZE = 100 
        current_idx = start_index
        
        while current_idx < total_items:
            # Check Status
            status = progress_tracker.get_status(task_id)
            if status == "paused":
                time.sleep(1)
                continue
            if status == "stopped":
                print(f"Task {task_id} stopped.")
                break

            # Prepare chunk
            end_idx = min(current_idx + CHUNK_SIZE, total_items)
            chunk_items = work_items[current_idx:end_idx]
            
            # Execute chunk in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                # Map future -> (row, col, original_text)
                future_to_item = {}
                for item in chunk_items:
                    row, col, text = item
                    
                    # Apply Pre-Glossary
                    for term, trans in pre_glossary.items():
                        text = text.replace(term, trans)
                        
                    future = executor.submit(self.translate_text_with_retry, text, retries=5, custom_patterns=protected_patterns)
                    future_to_item[future] = (row, col)
                
                for future in concurrent.futures.as_completed(future_to_item):
                    if progress_tracker.get_status(task_id) == "stopped":
                        break
                        
                    row, col = future_to_item[future]
                    try:
                        translated_text = future.result()
                        
                        # Apply Post-Glossary
                        for term, trans in post_glossary.items():
                            translated_text = translated_text.replace(term, trans)
                        
                        # Update DataFrame (for local consistency if needed)
                        df.at[row, col] = translated_text
                        
                        # Update Firebase
                        if dataset_id:
                            firebase_service.update_cell(dataset_id, row, col, translated_text)
                            
                    except Exception as e:
                        print(f"Error in thread for {row}:{col} - {e}")
                    
                    processed_count += 1
                    if processed_count % 5 == 0 or processed_count == total_items:
                        progress_tracker.update_progress(task_id, processed_count, processed_count)

            current_idx = end_idx
            progress_tracker.update_progress(task_id, processed_count, processed_count)

        progress_tracker.update_status(task_id, "completed")
        print(f"Task {task_id} completed.")

# Singleton instance
try:
    translation_service = TranslationService()
except Exception as e:
    print(f"CRITICAL ERROR initializing TranslationService: {e}")
    traceback.print_exc()
    translation_service = None