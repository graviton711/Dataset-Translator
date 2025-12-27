import re
import uuid

class TextPreprocessor:
    # Combined pattern for Code Blocks, LaTeX Blocks, Inline Code
    # Group 1: Code Block (```...```)
    # Group 2: LaTeX Block ($$...$$)
    # Group 3: Inline Code (`...`)
    # Note: We use non-capturing groups for the outer OR to avoid extra split results, 
    # but re.split will capture the delimiter if in capturing parentheses.
    # So we wrap the whole thing in one capturing group.
    
    # Regex explanation:
    # (```[\s\S]*?```)      -> Match code blocks
    # |                     -> OR
    # (\$\$[\s\S]*?\$\$)    -> Match LaTeX blocks
    # |                     -> OR
    # (`[^`\n]+`)           -> Match inline code
    # |                     -> OR
    # (<think>[\s\S]*?</think>) -> Match think blocks (reasoning)
    
    PATTERN = re.compile(r'(```[\s\S]*?```|\$\$[\s\S]*?\$\$|`[^`\n]+`|<think>[\s\S]*?</think>)')

    @staticmethod
    def split(text, custom_patterns=None):
        """
        Splits text into segments of (is_translatable, content).
        custom_patterns: List of dicts [{'start': '...', 'end': '...'}]
        """
        # Base patterns
        patterns = [
            r'```[\s\S]*?```',       # Code blocks
            r'\$\$[\s\S]*?\$\$',     # LaTeX blocks
            r'`[^`\n]+`',            # Inline code
        ]
        
        # Add custom patterns
        if custom_patterns:
            for pat in custom_patterns:
                s = re.escape(pat['start'])
                e = re.escape(pat['end'])
                # Non-greedy match between start and end
                patterns.append(f'{s}[\\s\\S]*?{e}')

        # Combine into one regex
        full_pattern = '|'.join(f'({p})' for p in patterns)
        regex = re.compile(full_pattern)

        # re.split with capturing group returns [text, delimiter, text, delimiter, ...]
        parts = regex.split(text)
        
        segments = []
        for part in parts:
            if not part:
                continue
            
            # Check if the part matches any of our non-translatable patterns
            # We need to check against the full regex
            if regex.fullmatch(part):
                segments.append({'type': 'non_text', 'content': part})
            else:
                # It's normal text.
                # To ensure we don't exceed the context window (n_ctx=4096),
                # we further split by newlines. This processes text paragraph by paragraph.
                sub_parts = re.split(r'(\n+)', part)
                for sub in sub_parts:
                    if not sub:
                        continue
                    segments.append({'type': 'text', 'content': sub})
                
        return segments

    @staticmethod
    def extract(text):
        # Legacy method kept for compatibility if needed, but we are moving to split-merge
        pass

    @staticmethod
    def restore(text, placeholders):
        # Legacy method
        pass
