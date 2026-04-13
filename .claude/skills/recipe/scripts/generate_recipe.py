import argparse
import json
from datetime import datetime
from pathlib import Path


def load_ingredients(ingredients_dir: Path) -> list[dict]:
    ingredients = []
    for file_path in sorted(ingredients_dir.glob("*.json")):
        data = json.loads(file_path.read_text(encoding="utf-8"))
        data["_file"] = file_path.name
        ingredients.append(data)
    return ingredients


def choose_recipes(ingredient_names: set[str]) -> list[dict]:
    recipes = [
        {
            "title": "김치 대파 계란라면",
            "required": {"김치", "대파", "계란", "라면"},
            "servings": "1인분",
            "time": "약 12분",
            "difficulty": "자취생",
            "steps": [
                "냄비에 물 550ml를 끓인다.",
                "김치와 대파를 먼저 넣고 1분 정도 끓인다.",
                "라면과 스프를 넣고 면이 풀릴 때까지 익힌다.",
                "면이 거의 익으면 계란을 넣고 30~40초 더 끓인다.",
                "불을 끄고 그릇에 담아 완성한다.",
            ],
            "tip": "대파를 기름에 20초 정도 먼저 볶으면 풍미가 더 좋아진다.",
        },
        {
            "title": "김치 계란볶음",
            "required": {"김치", "계란"},
            "servings": "1인분",
            "time": "약 10분",
            "difficulty": "자취생",
            "steps": [
                "김치를 먹기 좋은 크기로 썬다.",
                "팬에 기름을 두르고 김치를 2분간 볶는다.",
                "풀어둔 계란을 넣고 빠르게 섞어가며 볶는다.",
                "간을 보고 필요하면 소금 한 꼬집을 더한다.",
            ],
            "tip": "대파가 있으면 마지막에 넣어 향을 살린다.",
        },
        {
            "title": "대파 계란국",
            "required": {"대파", "계란"},
            "servings": "1인분",
            "time": "약 8분",
            "difficulty": "자취생",
            "steps": [
                "냄비에 물 500ml를 끓인다.",
                "대파를 넣고 2분간 끓여 향을 낸다.",
                "풀어둔 계란을 천천히 부어 몽글하게 익힌다.",
                "소금 또는 간장으로 간을 맞춘다.",
            ],
            "tip": "참기름이 있으면 마지막에 2~3방울 넣으면 좋다.",
        },
        {
            "title": "토달토달 해장탕",
            "required": {"토마토", "양파", "계란"},
            "servings": "1인분",
            "time": "약 12분",
            "difficulty": "자취생",
            "steps": [
                "팬에 기름을 두르고 양파를 1분 볶은 뒤 토마토를 넣고 으깨듯 볶는다.",
                "물 또는 육수 450ml를 넣고 끓인다.",
                "소금, 간장 조금, 후추로 간하고 설탕을 아주 약간 넣어 산미를 정리한다.",
                "풀어둔 계란을 가장자리에 둘러 붓고 30초 정도 익힌 뒤 불을 끈다.",
                "대파 또는 쪽파를 올려 마무리한다.",
            ],
            "tip": "밥이나 우동면을 곁들이면 해장용 한 끼로 좋다.",
        },
        {
            "title": "자취 나베 한냄비",
            "required": {"양배추", "양파", "대파", "버섯", "돼지고기"},
            "servings": "1인분",
            "time": "약 15분",
            "difficulty": "자취생",
            "steps": [
                "냄비에 육수 600ml를 붓고 끓인다.",
                "양배추와 양파를 먼저 넣고 3분 끓인다.",
                "돼지고기와 버섯을 넣고 중불로 5분 더 끓인다.",
                "국간장, 소금, 후추, 다진 마늘로 간을 맞춘다.",
                "대파를 넣고 1분 더 끓여 마무리한다.",
            ],
            "tip": "우동사리나 밥을 곁들이면 한 끼가 완성된다.",
        },
        {
            "title": "후룩국 카레파스타",
            "required": {"돼지고기", "양파", "마늘", "카레", "파스타"},
            "servings": "1인분",
            "time": "약 15분",
            "difficulty": "자취생",
            "steps": [
                "냄비에 기름을 두르고 양파, 마늘, 돼지고기를 충분히 볶는다.",
                "물 500ml를 붓고 카레를 넣어 국물 농도를 맞춘다.",
                "파스타 면을 반만 삶아 카레 국물에 넣는다.",
                "남은 시간을 국물에서 끓이며 면을 익힌다.",
                "소금, 후추로 간을 맞추고 대파를 올린다.",
            ],
            "tip": "면을 미리 절반만 익혀야 15분 안에 끝낼 수 있다.",
        },
        {
            "title": "갸루상 컵케이크",
            "required": {"식빵", "생크림"},
            "servings": "1인분",
            "time": "약 10분",
            "difficulty": "자취생",
            "steps": [
                "식빵을 한입 크기로 자른다.",
                "컵에 식빵, 생크림, 토핑 순서로 층층이 쌓는다.",
                "같은 순서를 한 번 더 반복한다.",
                "과일이나 초코 시럽으로 마무리한다.",
            ],
            "tip": "오븐 없이 조립만으로 만드는 디저트다.",
        },
    ]

    matches = [r for r in recipes if r["required"].issubset(ingredient_names)]
    if matches:
        return matches
    return [
        {
            "title": "재료 기반 즉석 레시피",
            "required": set(),
            "servings": "1인분",
            "time": "약 10~15분",
            "difficulty": "자취생",
            "steps": [
                "사용 가능한 재료를 볶음/국/면/디저트 중 한 가지로 분류한다.",
                "향채(대파) -> 주재료(김치/면/계란) 순서로 익힌다.",
                "간은 소금이나 간장으로 최소한만 맞춘다.",
            ],
            "tip": "김풍식 핵심은 단순 조합과 빠른 완성이다. 1인분, 15분 이내를 유지한다.",
        }
    ]


def build_markdown(ingredients: list[dict], recipes: list[dict]) -> str:
    lines = []
    lines.append(f"# 냉장고 레시피 추천 ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    lines.append("")
    lines.append("## 보유 재료")
    for item in ingredients:
        lines.append(f"- {item['name']} ({item['quantity']}, {item['category']})")
    lines.append("")

    main_recipe = recipes[0]
    lines.append(f"## 오늘의 추천: {main_recipe['title']}")
    lines.append(
        f"- 조건: {main_recipe['servings']} / {main_recipe['time']} / 난이도 {main_recipe['difficulty']}"
    )
    for idx, step in enumerate(main_recipe["steps"], start=1):
        lines.append(f"{idx}. {step}")
    lines.append("")
    lines.append(f"- 팁: {main_recipe['tip']}")
    lines.append("")

    if len(recipes) > 1:
        lines.append("## 추가 추천")
        for recipe in recipes[1:]:
            lines.append(f"- {recipe['title']}")
        lines.append("")

    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ingredients-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    ingredients_dir = Path(args.ingredients_dir)
    output_dir = Path(args.output_dir)

    ingredients = load_ingredients(ingredients_dir)
    if not ingredients:
        raise ValueError(f"No ingredient JSON files found: {ingredients_dir}")

    ingredient_names = {item["name"] for item in ingredients}
    recipes = choose_recipes(ingredient_names)
    content = build_markdown(ingredients, recipes)

    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"recipe-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
    output_path = output_dir / filename
    output_path.write_text(content, encoding="utf-8")
    print(str(output_path))


if __name__ == "__main__":
    main()
