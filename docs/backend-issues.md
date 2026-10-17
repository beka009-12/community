# Вопросы и доработки для бэкенда

Дата: 2026-10-08 · API: `$API_URL/docs/` (адрес сервера не хранится в репозитории — он в `.env`)

Фронтенд переводится на API: только серверные запросы из Next, JWT хранится в
httpOnly cookie (дизайн: `docs/superpowers/specs/2026-10-08-api-integration-design.md`).
Ниже собрано всё, что мешает сейчас или помешает позже. Пункты идут по
важности, к каждому есть способ воспроизвести.

## Блокеры

### 1. `/ru/admin/members/` перехватывается Django-админкой

```
curl -i "$API_URL/admin/members/"
→ 302 Location: /ru/admin/login/?next=/ru/admin/members/
```

Похоже, `admin.site.urls` подключён в `i18n_patterns` раньше API и забирает
весь префикс `admin/`. Из-за этого в админке сайта не работает раздел
«Участники» целиком: список, создание, правка, удаление.

Варианты исправления: перенести Django-админку на другой префикс (например,
`django-admin/`) или переименовать API-префикс. Сообщите, какой путь будет
финальным.

### 2. Нет тестовых аккаунтов Team_Lead и Developer

Аккаунт Admin есть (2026-10-09): вход, обновление токена, выход и админка
проверены вживую. Для Team_Lead и Developer аккаунтов пока нет, поэтому
кабинет `/account` и запрет входа в админку для этих ролей не проверены.

### 3. API работает по http на голом IP

Логин, пароль и JWT передаются между сервером сайта и API открытым текстом.
Для продакшна нужны домен и HTTPS.

### 4. Участник может сам поменять себе роль (безопасность)

По Swagger в `PATCH /personal-account/` (схема `UserProfileName`) поле `role`
доступно на запись. Если сервер это действительно принимает, любой Developer
может сделать себя Admin одним запросом и получить всю админку. Мы это не
проверяли, чтобы не менять права в обход.

Проверить на тестовом Developer:

```
PATCH /ru/personal-account/  {"role": "Admin"}   (Bearer токен Developer)
→ ожидаем 400 или игнор поля; role в ответе должна остаться "Developer"
```

Исправление: в сериализаторе личного кабинета `role` (и `status`) только для
чтения — `read_only_fields = ["role", "status"]`. Менять роль может только
админ через `/admin/members/{id}/`.

### 5. Сертификат нельзя создать без картинки

Проверено 2026-10-17 под Admin. По Swagger (схема `Certificates`)
`certificate_image` только для чтения и в `required` не входит, но без файла
сервер отклоняет создание:

```
POST /ru/personal-account/certificates/
{"title": "x", "organization": "y", "given_date": "2026-05-20", "text": "z"}
→ 400 {"certificate_image": ["Ни одного файла не было отправлено."]}
```

С тем же телом в `multipart/form-data` плюс файлом `certificate_image` → 201.
`PATCH` и `DELETE` `/personal-account/certificates/{id}/` без файла работают.
Из-за этого в кабинете кнопка «Добавить сертификат» всегда заканчивается
ошибкой: формы с файлом у нас нет, потому что по Swagger поле не принимает
запись.

Исправление: сделать картинку необязательной — в модели
`certificate_image = models.ImageField(..., blank=True, null=True)` и миграция
отдельным файлом, либо `extra_kwargs = {"certificate_image": {"required": False}}`
в сериализаторе. Если загрузка картинки нужна, опишите её в Swagger (поле
не `readOnly`, запрос `multipart/form-data`) — тогда добавим выбор файла в
форму.

## Доработка: команда у проекта

Сейчас проект и команда никак не связаны: у `Project` нет поля команды ни в
модели, ни в API. Если в админке создать команду, назначить её на проект
нельзя, и участников приходится добавлять в проект заново по одному.

### Что нужно

1. Поле `team` у проекта: одна команда на проект, можно без команды.
2. В ответах `GET /projects/` и `GET /projects/{id}/` поля `team` (id) и
   `team_name`. Так публичный сайт сможет показать команду проекта без доступа
   к `/teams/`.
3. `team` можно передать в `POST /projects/` и `PATCH /projects/{id}/`, `null`
   снимает команду.
4. Когда проекту назначают команду, её участники добавляются в участники
   проекта с теми же ролями (`Team_Lead` / `Developer`). Тех, кто уже есть в
   проекте, не трогаем. Всё в одной транзакции.
5. Когда команду снимают (`team: null`), участники проекта остаются.
6. Фильтр `GET /projects/?team=6`.

### Контракт

```
PATCH /ru/projects/1/
Authorization: Bearer <access админа>
{"team": 6}

→ 200
{
  "id": 1,
  "name": "Motion LMS Platform",
  "project_status": "In_progress",
  "category": "Education",
  "team": 6,
  "team_name": "тест",
  "members": [
    {"id": 41, "project": 1, "user": 2, "role": "Team_Lead"},
    {"id": 42, "project": 1, "user": 5, "role": "Developer"}
  ],
  ...
}
```

```
GET /ru/projects/
→ 200
[{"id": 1, "name": "Motion LMS Platform", "team": 6, "team_name": "тест", ...}]
```

Ошибка, если такой команды нет:

```
PATCH /ru/projects/1/ {"team": 999}
→ 400 {"team": ["Недопустимый первичный ключ \"999\" - объект не существует."]}
```

### Пример реализации (Django + DRF)

`models.py`:

```python
class Project(models.Model):
    # ...существующие поля...
    team = models.ForeignKey(
        "Team",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,  # удалили команду — проект остаётся без неё
        related_name="projects",
    )
```

Миграция отдельным файлом: `python manage.py makemigrations motion_app && python manage.py migrate`.

`serializers.py`:

```python
from django.db import transaction
from rest_framework import serializers

from .models import Project, ProjectMember, Team, TeamMember


def copy_team_members(project: Project) -> None:
    if project.team_id is None:
        return
    existing = set(
        ProjectMember.objects.filter(project=project).values_list("user_id", flat=True)
    )
    ProjectMember.objects.bulk_create(
        ProjectMember(project=project, user_id=member.user_id, role=member.role)
        for member in TeamMember.objects.filter(team_id=project.team_id)
        if member.user_id not in existing
    )


class ProjectDetailSerializer(serializers.ModelSerializer):
    team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.all(), allow_null=True, required=False
    )
    team_name = serializers.CharField(source="team.team_name", read_only=True, default=None)

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "project_status", "category",
            "preview_image", "demo_url", "github_url", "created_at",
            "team", "team_name", "members",
        ]

    @transaction.atomic
    def create(self, validated_data):
        project = super().create(validated_data)
        copy_team_members(project)
        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        previous_team_id = instance.team_id
        project = super().update(instance, validated_data)
        if project.team_id and project.team_id != previous_team_id:
            copy_team_members(project)
        return project
```

В `ProjectListSerializer` добавить те же `team` и `team_name` (только чтение),
во вьюхе списка — `filterset_fields = [..., "team"]` и
`select_related("team")`, чтобы не было N+1.

### Как проверить

```bash
TOKEN=...  # access админа из POST /ru/auth/login/
curl -X PATCH "$API_URL/projects/1/" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"team": 6}'
# → в ответе team: 6, team_name, участники команды 6 среди members

curl "$API_URL/projects/?team=6"
# → в списке проект 1

curl -X PATCH "$API_URL/projects/1/" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"team": null}'
# → team: null, members не изменились
```

После этого на фронте: выбор команды в форме проекта в админке и строка
«Команда: …» на странице проекта.

## Swagger не совпадает с реальными ответами

- `ProjectDetail.members` и `TeamDetail.members` описаны как `string`, а
  приходит массив `{id, project|team, user, role}`.
- `MemberProfileDetail.projects` описан как `string`, а приходит массив
  проектов.
- `POST /auth/login/`: схема ответа повторяет запрос (`username`, `password`).
  Реальный ответ (ожидаем `access` и `refresh`) не описан.
- `GET /stats/` и `GET /auth/verify/`: у ответа нет схемы.
- `POST /auth/logout/`: не описано тело запроса. Ждёт ли он `refresh`?
- В `securityDefinitions` указан `Basic`, хотя авторизация идёт через Bearer JWT.

Для `SerializerMethodField` схему можно задать через `@swagger_serializer_method`.

## Поведение

- `GET /personal-account/` без токена отдаёт
  `200 {"id": null, "login": "", ...}`, а должен отдавать 401.
- `GET /teams/` требует авторизацию. Если публичная страница «Команда» должна
  показывать команды, нужен публичный доступ на чтение.
- В `UserProfileDetail` поле `status` доступно только для чтения, поэтому
  админ может включить или отключить участника только через
  `PATCH /members/{id}/`. Кому разрешён этот PATCH: админу для любого участника?
- В составе команды или проекта нельзя сменить роль: нет PATCH для
  `/teams/{id}/members/{userId}/` и `/projects/{id}/members/{userId}/`. Сейчас
  смена роли — это удалить и добавить заново.
- У заявок только два статуса, `New` и `Reviewing`. Если нужны «Принята»,
  «В работе», «Готово» и «Отклонена», их нужно добавить в enum.
- Нет rate limiting на `POST /auth/login/` и на публичный `POST /client-requests/`.
- `GET /projects/?ordering=name` не меняет порядок. Проверьте `ordering_fields`.

## Данные, которых не хватает фронту

- В `ProjectList` нет `description` и `members`. Из-за этого карточки проектов
  остаются без описания, а для блока «Команды по проектам» приходится
  запрашивать каждый проект отдельно (N+1).
- В `MemberProfileList` нет `bio` и `skills`.
- В `MemberProfileDetail` нет опыта, образования, языков и сертификатов, поэтому
  публичный профиль остаётся без резюме. Сейчас эти данные отдаёт только
  `/personal-account/` своему владельцу.
- В `MemberProfileDetail.projects` нет роли участника в проекте.
- Нет загрузки файлов: `avatar`, `preview_image`, `team_image`, `resume` и
  `certificate_image` доступны только для чтения. Исключение —
  `certificate_image`: по факту сервер его принимает и даже требует (см.
  блокер 5).
- Мелочь: поле `Languages.Level` начинается с заглавной буквы, остальные поля в
  snake_case.
