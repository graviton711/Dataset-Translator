from googletrans import Translator

translator = Translator()
result = translator.translate("	Design a dark mode toggle button that switches themes and stores user preference using HTML, CSS, and JavaScript.", src="en", dest="vi")
print(result.text)
