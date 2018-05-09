#!/usr/bin/env node
/*
i18n_translate CLI
Uses first section key as source language, and translates all value keys to the given language
Usage:
node i18n_translate to_lang [keyfile.json location] [optional_key_filter]
*/
var _colors 	=	require('colors'),
	_path 		= 	require('path'),
	_fs 		=	require('fs'),
	_ini 		=	require('ini'),
	wait 		=	require('wait.for'),
	filter 		=	"",
	tmp			=	{ cp:process.cwd(), all:0, translatable:0, script_path:_path.dirname(_fs.realpathSync(__filename)) },
	args 		= 	process.argv.slice(2);

const Translate = require('@google-cloud/translate');
var translate = {};

// CLI
console.log(_colors.green('i18n_translate\n****************'));

if (args.length>0) {
	tmp.tolang = args[0];
	// detect keyfile.json location, or use given path (google cloud key)
	tmp.keyfile = 'keyfile.json'; // use included keyfile if exists or not given
	//
	if (args.length>1) {
		if (args[1].indexOf('.json')!=-1) {
			tmp.keyfile = args[1]; // keyfile location
			if (args.length>2) {
				filter=args[2];
			}
		} else {
			filter=args[1];
		}
	}
	tmp.fkey = tmp.script_path + _path.sep + tmp.keyfile; //script file installed directory
	tmp.rkey = tmp.cp + _path.sep + tmp.keyfile; //current path directory
	if( _fs.existsSync(tmp.fkey) ) {
		translate = new Translate({
			keyFilename: tmp.fkey
		});
	} else if (_fs.existsSync(tmp.rkey) ) {
		translate = new Translate({
			keyFilename: tmp.rkey
		});
	} else {
		// just the path as given
		if( _fs.existsSync(tmp.keyfile) ) {
			translate = new Translate({
				keyFilename: tmp.keyfile
			});
		} else {
			console.log('ERROR the given Google Cloud keyfile.json file doesn\'t exist'.red);
			process.abort();
		}
	}
	// translate
	tmp.file = tmp.cp + _path.sep + 'i18n.ini';
	if( _fs.existsSync(tmp.file) ) {
		wait.launchFiber(procesar, tmp.file, tmp.tolang, filter);
	} else {
		console.log('Current directory doesn\'t contain a i18n.ini file!'.red);
	}
	//console.log('DEBUG args:',tmp);
} else {
	console.log('Missing arguments!'.red);
	console.log('Usage:'.yellow + ' i18n_translate to_lang_code'.green);
}

function translateMe(source, targetlang, cb) {
	translate
	.translate(source, targetlang)
	.then(results=> {
		cb(null, { from:source, to:results[0] });
	})
	.catch(err => {
		cb(err, {});
	});
}

function procesar(inifile, targetlang, filter) {
	var tmpb={ file:inifile, tolang:targetlang, filter:filter, all:0, translatable:0 };
	console.log('Reading current i18n.ini file ..');
	tmpb.source = _ini.parse(_fs.readFileSync(tmpb.file, 'utf-8'));
	tmpb.source_lang = Object.keys(tmpb.source)[0];
	console.log('- Translating from ['+tmpb.source_lang+'] to ['+tmpb.tolang+'] language ..');
	tmpb.target = JSON.parse(JSON.stringify(tmpb.source)); //clone source
	tmpb.target[tmpb.tolang]=tmpb.source[tmpb.source_lang]; //clone source lang over target lang
	// test for filter
	if (tmpb.filter!='') {
		console.log('- Filtering keys using \''+tmpb.filter+'\' keyword');
	}
	var allkeys = Object.keys(tmpb.source[tmpb.source_lang]).length;
	console.log('- Translating '+allkeys+' strings ..');
	//
	for (tmpb.key in tmpb.source[tmpb.source_lang]) {
		tmpb.all++;
		if (tmpb.key.toLowerCase().indexOf(filter.toLowerCase())!=-1) {
			tmpb.value = tmpb.source[tmpb.source_lang][tmpb.key];
			tmpb.translatable++;
			if (tmpb.value) {
				if (tmpb.value.indexOf('{')!=-1 && tmpb.value.indexOf('}')!=-1) {
					// value contains {}
				} else if (tmpb.value.indexOf('%1$s')!=-1) {
					// value contains a VAR
				} else if (tmpb.value.indexOf('**')!=-1) {
					// value contains an unescaped VAR
				} else {
					//
					try {
						var resp = wait.for(translateMe,tmpb.value,tmpb.tolang);
						console.log(tmpb.all+' ['+tmpb.source_lang+'] from: '+resp.from);
						console.log(tmpb.all+' ['+tmpb.tolang+'] to: '+resp.to);
						tmpb.target[tmpb.tolang][tmpb.key] = resp.to;
						if (tmpb.all == allkeys) {
							console.log('\nall strings processed, saving ini file');
							_fs.writeFileSync(inifile, _ini.stringify(tmpb.target));
							console.log('ready!');
							process.exit(1);
						}
					} catch(e) {
						console.log('ERROR',e);
					}
				}
			}
		}
	}
}

