# Aplikacja do pobierania danych "Search Analytics" z GSC

## Instalacja pakietów nodejs

1. Musimy posiadać NodeJS w wersji 18 lub wyższej oraz NPM
2. W terminalu, w katalogu z aplikacją wpisujemy komendę
   `npm i`

## Konfiguracja Google Cloud

1. Należy utworzyć projekt w Google Cloud i dodać do niego API Google Search Console
2. Należy utowrzyć indentyfikator OAuth 2.0 dla Aplikacji internetowej - koniecnzie w polu "Autoryzowane identyfikatory URI przekierowania" należy dodać adres http://localhost:5632 (jeśli PORT 5632 jest zajęty można go zmienić w pliku `.env`)
3. Pobrać klienta OAuth w postaci pliku JSON i zapisać go w głównym katalogu tego projektu pod nazwą "credentials.json"

## Konfiguracja pliku .env

1. Należy skopiować plik `.env.example` i zmienić nazwę utworzonej kopi na `.env`
2. W pliku skonfigurować nazwę usługi (`SITE_URL` - pamiętając że w przpadku usułg domeny wpisujemy `sc-domain:example.com` a w przypadku usług prefixu dany prefix np `https://example.com/`)
3. Należy skonfigurować wymiary i daty w pliku według agregacji która nas interesuje

## Uruchomienie aplikacji

1. Aplikację uruchamiamy za pomocą komendy
   `npm run start`
2. Jeśli wszystko skonfigurowaliśmy poprawnie powinno nam się otworzyć okno przeglądarki w którym musimy wybrać konto Google na którym znajduje się wybrana przez nas usługa GSC
3. Po zalogowaniu, rozpocznie się proces pobierania danych za skonfigurowany okres
4. W katalogu głównym aplikacji pojawi się plik .CSV zawierajacy pobrane dane

## Wylogowanie z konta Google

1. Chcąc się wylogować z danego konta (np. w celu użycia usługi z innego konta Google) wpisujemy komendę
   `npm run logout`

## Filtracja

1. W głównym katalogu utworzyć plik tekstowy zawierający listę adresów URL (każdy w osobnej lini).
2. Dodać do pliku `.env` nazwę utworzonego w pierwszym kroku pliku w polu `FILTER_FILE`.
3. Dodać do pliku `.env` nazwę pliku z danymi do filtracji np. `data-(...).csv`.
4. Uruchomić komendę
   `npm run start`
