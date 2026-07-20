# Kokos piratäventyr

En liten, fristående mobilwebbapp för skattjakt med Apan Koko.

## Användning

1. Öppna appen med `?setup=1` första gången.
2. Lägg in kartan, Kokos meddelande, så många stationer som behövs, bokstav från varje station och skattens slutledtråd.
3. Tryck **Spara och öppna äventyret**.
4. Lämna mobilen till barnen. Skärmen är helt blank tills de har tryckt fyra gånger på skärmens högra tredjedel.
5. Varje ny händelse kräver fyra nya tryck på höger sida.

Flödet blir: Kokos meddelande och karta → stationens instruktion → klartext med bokstav och karta → nästa station. När alla stationer är klara placerar barnen bokstavsbrickorna i rätt ordning för att få skattens sista ledtråd.

Allt sparas i den aktuella webbläsaren på mobilen och finns normalt kvar efter omstart. Kartbilden lagras där också. Välj därför en rimligt liten kartbild, helst en JPEG på några megabyte eller mindre. I setupen finns även **Hämta sparad JSON** och **Ladda JSON**. JSON-filen är en fullständig lokal backup, inklusive karta, och kan laddas in på samma eller en annan mobil. För att ändra äventyret senare: öppna samma länk med `?setup=1` i slutet.

## Teknisk form

Appen är helt statisk, utan konto, server eller beroenden. Den går att lägga till på telefonens hemskärm från webbläsarens meny och fungerar därefter även utan internet, efter första öppningen.
