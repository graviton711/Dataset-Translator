from text_preprocessor import TextPreprocessor

def test_preprocessor():
    sample_text = """
Here is some python code:
```python
def hello():
    print("Hello world")
```

And here is some inline code `print("test")` inside a sentence.

Also a latex block:
$$
E = mc^2
$$

And normal text.
"""
    print("--- Original Text ---")
    print(sample_text)
    
    # Extract
    processed, placeholders = TextPreprocessor.extract(sample_text)
    print("\n--- Processed Text (Sent to LLM) ---")
    print(processed)
    print("\n--- Placeholders ---")
    for k, v in placeholders.items():
        print(f"{k}: {v[:20]}...")

    # Simulate Translation (LLM just returns the text, maybe slightly modified)
    translated_simulated = processed.replace("Here is some python code", "Đây là một số mã python")
    translated_simulated = translated_simulated.replace("And here is some inline code", "Và đây là mã nội dòng")
    translated_simulated = translated_simulated.replace("inside a sentence", "trong một câu")
    
    print("\n--- Simulated Translation ---")
    print(translated_simulated)

    # Restore
    restored = TextPreprocessor.restore(translated_simulated, placeholders)
    print("\n--- Restored Text ---")
    print(restored)

    # Verification
    assert "```python" in restored
    assert "def hello():" in restored
    assert "`print(\"test\")`" in restored
    assert "$$" in restored
    assert "Đây là một số mã python" in restored

    print("\n[PASS] All tests passed!")

if __name__ == "__main__":
    test_preprocessor()
