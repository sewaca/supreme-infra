import sys
import os


# Получаем заголовок PR из аргументов командной строки
if len(sys.argv) < 2:
    print("FATAL: Did not get any pr title")
    sys.exit(1)
pr_title = sys.argv[1].strip()
print(f"pr_title='{pr_title}'")

# Получаем теги из переменной окружения TAGS
tags = os.getenv('TAGS')
if not tags:
    print("FATAL: Did not get tags array")
    sys.exit(1)
tag_list = [tag.strip() for tag in tags.split('\n') if tag.strip() != '']
print(f"tag_list='{tag_list}'")

if any(pr_title.startswith(tag) for tag in tag_list):
    sys.exit(0)

print(f"Wrong title format. None of correct tags found in '{pr_title}'")
sys.exit(1)

