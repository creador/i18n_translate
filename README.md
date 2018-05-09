Helper to translate any Creador OPEN i18n.ini file strings to another language
================================================================================
## INTRO

This command-line (CLI) helps you add any translation language for the given Creador OPEN i18n.ini file.<br/><br/>
Just execute it within a Creador OPEN project directory and add the target language code (ex. en); it will use the first section language code as the source language (ex. es). 

## Installation
```javascript
npm install i18n_translate -g
```

## Usage
You can use the CLI as follows:  

```javascript
i18n_translate target_lang_code [googlekeyfile.json location] [optional_key_filter]
```

## UPDATES

version 1.0.2: 
- first beta version, Mac/Linux compatible.
- Add readme.md file