import sys
import os

def main():
    # Получаем заголовок PR из аргументов командной строки
    if len(sys.argv) < 2:
        print("FATAL: Did not get any pr title")
        sys.exit(1)

    pr_title = sys.argv[1]
    print("pr title is", pr_title)

    # Получаем теги из переменной окружения TAGS
    tags = os.getenv('TAGS')
    if not tags:
        print("FATAL: Did not get tags array")
        sys.exit(1)

    tag_list = [tag.strip() for tag in tags.split('\n')]

    print("tag_list is ", tag_list)
    
    if any(pr_title.startswith(tag) for tag in tag_list): 
        sys.exit(0)

    print(f"Wrong title format. None of correct tags found in {pr_title}")
    sys.exit(1)

sys.exit(5)
main()
# if __name__ == "__main__":
    # main()
