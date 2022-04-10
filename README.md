# nodet project

## Distinctiveness and complexity:

nodet is simple fullstack project based on NodeJS (ExpressJS) with
frontend on hbs+JS, pack by docker-compose. Frontend side has one main page (/views/index.html)
and one page for showing results of some of the requests.
(/views/objectsList.html).

During the development, the following functionality was implemented:

##### Query elements by unique id
Request forms by id are located on the main page under the headings:
**Find country by id /api/country** 
**Find satellite by id /api/satellite**


##### Просмотр списка элементов каждой сущности постранично (доступен вывод в количестве 3, 5 или 10 записей на странице). 
Viewing the list of elements of each type by page (output is available in the amount of 3, 5 or 10 elements per page).
Forms for requests are implemented in blocks:
**Get countries** 
**Get satellites**

#####  Getting related elements
The type of connection of conditional "entities" in this application is similar
OneToMany (One satellite is launched by one country, however each country
can launch many satellites), so after request a country by id we
get all the satellites launched by this country, and after we request of satellite -
we will get the country that launched it. Information is displayed in
other page, which also has a back button.

##### Search for elements by an arbitrary string key.
Search form is in the block: **Search for an object**

When a string is sent, searching is happaning for all
database records, by the name field. Field values starting with
searched string will also be displayed in the list of results.

## Additional Methods(development)

##### Adding a country 
**Test post to /api/add_country**

##### Adding a satellite 
**Test post to /api/add_satellite**

##### Open lists of all elements of type (with button Delete) 
**Open List of countries**
**Open List of satellites**

##### Delite element 

## Files: 
* docker-compose.yml
* dbdata/ - folder for data (in this project, db is included in pack)

### expressapp/ - main folder
* expressapp/app.js - server NodeJS/ExpressJS
* expressapp/Dockerfile - settings for nodeapp-container
* expressapp/views - folder for html pages
* expressapp/public - folder for js and css   
* expressapp/txt.txt - file with data JSON


## Installation and configuration

1. Clone the git repository

$git clone https://github.com/zm412/nodet.git

2. Go to the nodet folder

$cd nodet 

3. Enter the instructions 

$docker-compose up --build


