import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import datetime

# Load environment variables
load_dotenv()

class FirebaseService:
    def __init__(self):
        self.db = None
        self.initialize()

    def initialize(self):
        try:
            if not firebase_admin._apps:
                cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
                if not cred_json:
                    print("Error: FIREBASE_CREDENTIALS_JSON not found in .env")
                    return

                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin initialized successfully.")
            
            self.db = firestore.client()
            print("Firestore client initialized.")
            
        except Exception as e:
            print(f"Failed to initialize Firebase: {e}")
            self.db = None

    # --- DATASET OPERATIONS ---
    def create_dataset(self, filename, columns, file_type='csv'):
        if not self.db: return None
        
        try:
            doc_ref = self.db.collection("datasets").document()
            dataset_id = doc_ref.id
            
            doc_ref.set({
                "filename": filename,
                "columns": columns,
                "file_type": file_type,
                "created_at": datetime.datetime.now()
            })
            return dataset_id
        except Exception as e:
            print(f"Error creating dataset: {e}")
            return None

    def get_dataset_meta(self, dataset_id):
        if not self.db: return None
        try:
            doc = self.db.collection("datasets").document(dataset_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting dataset meta: {e}")
            return None

    def save_cells(self, dataset_id, df):
        """
        Batch save initial cells to Firestore.
        Using a batch size of 500 (Firestore limit).
        """
        if not self.db: return
        
        try:
            batch = self.db.batch()
            count = 0
            
            # Convert DataFrame to list of dicts for iteration
            # We'll use a composite ID: {row_idx}_{col_key}
            for row_idx, row in df.iterrows():
                for col in df.columns:
                    val = str(row[col])
                    # Only save non-empty or save all? Saving all ensures grid integrity.
                    
                    doc_ref = self.db.collection("datasets").document(dataset_id)\
                                     .collection("cells").document(f"{row_idx}_{col}")
                    
                    batch.set(doc_ref, {
                        "row_idx": row_idx,
                        "col_key": col,
                        "value": val
                    })
                    
                    count += 1
                    if count >= 400: # Safe margin
                        batch.commit()
                        batch = self.db.batch()
                        count = 0
            
            if count > 0:
                batch.commit()
                
            print(f"Saved {len(df)} rows to Firestore.")
            
        except Exception as e:
            print(f"Error saving cells: {e}")

    def get_cells(self, dataset_id, limit=1000):
        """
        Fetch all cells for a dataset. 
        For very large datasets, we might need pagination, but for now fetch all.
        """
        if not self.db: return []
        
        try:
            # Fetch all cells
            docs = self.db.collection("datasets").document(dataset_id)\
                          .collection("cells").stream()
            
            cells = []
            for doc in docs:
                cells.append(doc.to_dict())
            
            return cells
        except Exception as e:
            print(f"Error getting cells: {e}")
            return []

    def update_cell(self, dataset_id, row_idx, col_key, new_value):
        if not self.db: return
        
        try:
            # 1. Get old value for History
            cell_ref = self.db.collection("datasets").document(dataset_id)\
                              .collection("cells").document(f"{row_idx}_{col_key}")
            
            snapshot = cell_ref.get()
            old_value = ""
            if snapshot.exists:
                old_value = snapshot.to_dict().get("value", "")
            
            # 2. Save to History
            self.db.collection("datasets").document(dataset_id)\
                   .collection("history").add({
                       "row_idx": row_idx,
                       "col_key": col_key,
                       "old_value": old_value,
                       "new_value": new_value,
                       "timestamp": datetime.datetime.now()
                   })
            
            # 3. Update Cell
            cell_ref.set({
                "row_idx": row_idx,
                "col_key": col_key,
                "value": new_value
            })
            
        except Exception as e:
            print(f"Error updating cell: {e}")

    # --- GLOSSARY OPERATIONS ---
    def add_glossary_term(self, term, translation, type='pre'):
        if not self.db: return None
        try:
            doc_ref = self.db.collection("glossary").add({
                "term": term,
                "translation": translation,
                "type": type
            })
            return doc_ref[1].id
        except Exception as e:
            print(f"Error adding glossary: {e}")
            return None

    def get_glossary(self):
        if not self.db: return []
        try:
            docs = self.db.collection("glossary").stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error getting glossary: {e}")
            return []

    def delete_glossary_term(self, term_id):
        if not self.db: return
        try:
            self.db.collection("glossary").document(term_id).delete()
        except Exception as e:
            print(f"Error deleting glossary: {e}")

    # --- UNDO OPERATIONS ---
    def undo_last_action(self, dataset_id):
        if not self.db: return None
        
        try:
            # Get latest history item
            history_query = self.db.collection("datasets").document(dataset_id)\
                                   .collection("history")\
                                   .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                                   .limit(1)
            
            docs = list(history_query.stream())
            if not docs:
                return None
            
            last_change = docs[0].to_dict()
            doc_id = docs[0].id
            
            # Revert cell
            row_idx = last_change['row_idx']
            col_key = last_change['col_key']
            old_value = last_change['old_value']
            
            self.db.collection("datasets").document(dataset_id)\
                   .collection("cells").document(f"{row_idx}_{col_key}")\
                   .update({"value": old_value})
            
            # Remove history item
            self.db.collection("datasets").document(dataset_id)\
                   .collection("history").document(doc_id).delete()
            
            return {
                "row_idx": row_idx,
                "col_key": col_key,
                "value": old_value
            }
            
        except Exception as e:
            print(f"Error undoing: {e}")
            return None

    # --- PROTECTED PATTERNS ---
    def get_protected_patterns(self):
        """
        Returns list of dicts: [{'id': doc_id, 'start': '...', 'end': '...'}]
        """
        if not self.db: return []
        try:
            docs = self.db.collection("settings").document("patterns").collection("items").stream()
            return [{"id": doc.id, **doc.to_dict()} for doc in docs]
        except Exception as e:
            print(f"Error getting patterns: {e}")
            return []

    def add_protected_pattern(self, start_tag, end_tag):
        if not self.db: return None
        try:
            doc_ref = self.db.collection("settings").document("patterns").collection("items").add({
                "start": start_tag,
                "end": end_tag
            })
            return doc_ref[1].id
        except Exception as e:
            print(f"Error adding pattern: {e}")
            return None

    def delete_protected_pattern(self, pattern_id):
        if not self.db: return
        try:
            self.db.collection("settings").document("patterns").collection("items").document(pattern_id).delete()
        except Exception as e:
            print(f"Error deleting pattern: {e}")

# Singleton
firebase_service = FirebaseService()
