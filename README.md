#BudapestKozutProjekt_Backend

Leírás:
A backendet NodeJs és Express használtalával valósítottam meg, amelyhez egy távoli elérésű MongoDB Atlas clustert kötöttem az adattároláshoz. A Google bejelentkezést megvalósítottam, emellett a képek feltöltésekor tárolásra a Firebase Storage-t használtam a statemanagementet pedig Redux Toolkittel valósítottam meg. Emelett JWT tokenes hitelesítést is alkalmaztam, amelyet a localStorage-ban tároltam, authentikációt is implementáltam egyes útvonalaknál.

Az alkalmazáshoz egy nívós frontendet is készítettem React, JavaScript, Material UI, Bootstrap, SCSS használatával, amelyet a BudapestKozutProjekt_Frontend nevű repom-ban lehet elérni. Az UI-ról képeket osztottam meg a frontend repo-jában, ha viszont szeretné futtathatóvá tenni az alkalmazást a következő lépéseket kell tennie:

1.Helyezz el egy config.env nevű fájlt a backend root mappájában. A sample.env fájl mintájaként.

2.Készíts egy MongoDB adatbázist, amelynek a connection stringjét mentsd a DATABASE nevű környezeti változóba a config.env-en belül.

3.Készíts egy Firebase alkalmazást. Az alkalmazáshoz tartozik egy firebaseConfig nevű objektum a Firebase Project Settings-en belül, ezt mentsd egy firebaseConfig.js nevű fájlba a root directoryba.

4.Ugyanitt a project settingsen belül a Service Accounts fülnél nyomj a generate new key gombra, majd a json-t mentsd a root directory-ba googleApplicationCredentials.json néven.

5.A GOOGLE_APPLICATION_CREDENTIALS nevű környzeti változó értékét változtasd meg az elérési útra, tehát ha a root directoryban van: GOOGLE_APPLICATION_CREDENTIALS=./googleApplicationCredentials.json.

6.A Google bejelentkezéshez a Google Cloud Platform használtalával hozz létre egy projektet, majd a bejelentkezési credentials-t mentsd egy googleLogin.json nevű fájlba a root directoryba.
