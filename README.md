# Bifrost
![logo](http://norse-mythology.org/wp-content/uploads/2012/11/Bifrost.jpg)
# Description

Bifrost cache and queue your POST request when internet is down. It will try to forward your query to the desired endpoint, if it fail it will save the POST data and try to update them periodically.
It will forward the response as it is.

# Installation

`git clone git@github.com:soixantecircuits/bifrost.git && cd bifrost`

`npm install`

### Config
Create a app/config/config.json file based on app/config/config.example.json :
`cp app/config/config.example.json app/config/config.json`

`npm start`

You should see in the log a line with the port and adress where bifrost is running.

`bifrost 0.0.1 is running on http://192.168.1.10:9090`

Now you can post directly their and do not worry about the connectivity.

# Docs

You can check the future wiki.

# Test

`npm test` uses newman to post 2000 requests

# Dev mode

in /app/config/config.json, set `dev > mode` to `true` to perform fake requests

