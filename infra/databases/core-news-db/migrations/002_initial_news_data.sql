-- Migration 002: initial seed news data

INSERT INTO news (title, url, date, category) VALUES
(
    'СПбГУТ и ассоциация «Дрон-Безопасность» стали стратегическими партнерами',
    'https://www.sut.ru/bonchnews/industry/25-03-2026-spbgut-i-associaciya-dron-bezopasnost-stali-strategicheskimi-partnerami',
    '25 марта 2026',
    'Индустрия'
),
(
    'Стань лидером: курс мини-лекций для студентов стартует 26 марта',
    'https://www.sut.ru/bonchnews/education/25-03-2026-stan-liderom:-kurs-mini-lekciy-dlya-studentov-startuet-26-marta',
    '25 марта 2026',
    'Образование'
),
(
    'Преподаватели СПбГУТ стали победителями грантового конкурса Фонда Владимира Потанина',
    'https://www.sut.ru/bonchnews/science/25-03-2026-prepodavateli-spbgut-stali-pobeditelyami-grantovogo-konkursa-blagotvoritelnogo-fonda-vladimira-potanina',
    '25 марта 2026',
    'Наука'
),
(
    'СПбГУТ представил потенциал на Российско-Китайском деловом форуме',
    'https://www.sut.ru/bonchnews/international/25-03-2026-spbgut-predstavil-obrazovatelniy-i-nauchniy-potencial-na-rossiysko-kitayskom-delovom-forume',
    '25 марта 2026',
    'Международное'
),
(
    'В СПбГУТ завершился первый день III Слёта разработчиков беспилотных систем',
    'https://www.sut.ru/bonchnews/industry/25-03-2026-v-spbgut-zavershilsya-perviy-den-III-obscherossiyskogo-sleta-razrabotchikov-bespilotnih-sistem',
    '25 марта 2026',
    'Индустрия'
),
(
    'Студенты СПбГУТ стали призёрами Всероссийского форума «Неделя инноватики ЛЭТИ»',
    'https://www.sut.ru/bonchnews/education/25-03-2026-studenti-spbgut-stali-prizerami-I-vserossiyskogo-nauchno-obrazovatelnogo-foruma-nedelya-innovatiki-leti',
    '25 марта 2026',
    'Образование'
)
ON CONFLICT (url) DO NOTHING;
