/**
 * Persistence plugin
 *
 * Copyright (c) 2009 Sergey Shchur (sergey.shchur@gmail.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

(function($) {

	var storage,sDatabase;
	var correctEngine = false;
	var engines = new Array("WhatWG","LocalStorage","SessionStorage","WebKit","userData");
	
	$.fn.persistenceInit = function(options) {
		settings = $.extend({}, $.fn.persistenceInit.defaults, options);
		if(!settings.method) {
			settings.method = $.fn.persistenceInit.getStorageMethod();
		} else {
			for(var i=0;i<engines.length;i++) {
				if(engines[i] == settings.method) {
					correctEngine = true;
				}
			}
			if(correctEngine) {
				debug('Storage Method: '+settings.method);
				if(settings.method == "WebKit") {
					try {
						sDatabase = openDatabase("persistance", "1.0", "Custom storage")
						if (!sDatabase) {
							debug("Failed to open the database on disk");
						}
					} catch(err) {
						debug("Error occured:"+err.message);
					}				
				} else if(settings.method == "userData") {
					storage = document.getElementById(settings.storageElement);
					if (!storage) {
						storage = document.createElement('span');
						storage.id = settings.storageElement;
						document.body.appendChild(storage);
						storage.addBehavior("#default#userData");
						storage.load(settings.userDataNamespace);
					}					
				}
			} else {
				debug('Storage Method: undefined');
			}
		}
		return this.each(function() {
			var $this = $(this);
			$this.html('test');
		});
	};

	$.fn.persistencePut = function(key, value) {
		if(correctEngine) {
			switch(settings.method) {
				case "WhatWG":
					var storage = globalStorage[settings.domain];
					storage[key] = value;
					debug('Value vor key ['+key+'] now is: '+value);
					break;
				case "LocalStorage":
					window.localStorage.removeItem(key);
					window.localStorage.setItem(key, value);
					debug('Value vor key ['+key+'] now is: '+value);
					break;
				case "SessionStorage":
					window.sessionStorage.removeItem(key);
					window.sessionStorage.setItem(key, value);
					debug('Value vor key ['+key+'] now is: '+value);
					break;				
				case "WebKit":
					sDatabase.transaction(
						function(tx) { 
							tx.executeSql("REPLACE INTO tblstorage (sName, sValue) VALUES (?,?)", 
								[key,value], 
								function() { },
								function(tx, error) {
									debug("Database error: "+error.message);
								}
							)
						}
					);
					debug('Value vor key ['+key+'] now is: '+value);
					break;
				case "userData":
					storage = document.getElementById(settings.storageElement);
					storage.setAttribute(key, value);
					storage.save(settings.userDataNamespace);				
					debug('Value vor key ['+key+'] is: '+value);
					break;
			}
		}
	};
	
	$.fn.persistenceGet = function(key) {
		if(correctEngine) {
			switch(settings.method) {
				case "WhatWG":
					var storage = globalStorage[settings.domain];
					value = String(storage[key]);
					debug('Value vor key ['+key+'] is: '+value);
					return value;
					break;
				case "LocalStorage":
					var value = window.localStorage.getItem(key);
					debug('Value vor key ['+key+'] is: '+value);
					return value;
					break;
				case "SessionStorage":
					var value = window.sessionStorage.getItem(key);
					debug('Value vor key ['+key+'] is: '+value);
					return value;
					break;				
				case "WebKit":
					sDatabase.transaction(
						function(tx) {
							tx.executeSql("SELECT sValue FROM tblstorage WHERE sName=?",
								[key],
								function(tx,result) {
									if (result.rows.length) {
										var value = result.rows.item(0).sValue;
									} else {
										callback.call(null, undefined)
									}
								}, 
								function(tx, error) {
									debug("Database error: "+error.message);
								}
							)
						}
					);
					debug('Value vor key ['+key+'] is: '+value);
					return value;
					break;
				case "userData":
					storage = document.getElementById(settings.storageElement);
					var value = storage.getAttribute(key);
					debug('Value vor key ['+key+'] is: '+value);
					return value;
					break;					
			}
		}
	};

	$.fn.persistenceInit.getStorageMethod = function() {
		correctEngine = true;
		if(typeof(globalStorage) != "undefined") {
			debug('Storage Method: WhatWG');
		    return "WhatWG";
		} else if (window.localStorage) {
			debug('Storage Method: LocalStorage');
		    return "LocalStorage";
		} else if (window.sessionStorage) {
			debug('Storage Method: SessionStorage');
		    return "SessionStorage";			
		} else if(typeof(window.openDatabase) != "undefined") {
            try {
                sDatabase = openDatabase("persistance", "1.0", "Custom storage")
                if (!sDatabase) {
                    debug("Failed to open the database on disk");
                } else {
                    sDatabase.transaction(
					    function(tx) {
                            tx.executeSql("CREATE TABLE IF NOT EXISTS tblstorage (sName TEXT, sValue TEXT, unique(sName))",
  							    [], 
								function() { },
								function(tx, error) {
								    debug("Database error: "+error.message);
								}
							)
                        }
					);
                }
            } catch(err) {
                debug("Error occured:"+err.message);
            }
			debug('Storage Method: WebKit');
			return "WebKit";
		} else if(document.body.addBehavior) {
			debug('Storage Method: userData');
			storage = document.getElementById(settings.storageElement);
			if (!storage) {
				storage = document.createElement('span');
				document.body.appendChild(storage);
				storage.addBehavior("#default#userData");
				storage.load(settings.userDataNamespace);
			}			
			return "userData";
		} else {
			debug('Storage Method: undefined');
		    return "undefined";
		}
	};
	
	$.fn.persistenceInit.defaults = {
		domain: location.hostname,
		method: null,
		storageElement: 'jqueryPersist',
		userDataNamespace: 'jqueryPersistNamespace',
		protocol: window.location.protocol == 'https' ? 'https' : 'http',
		debug: true
	};

	function debug(str) {
		if(settings.debug) {
			if (window.console && window.console.log) {
				window.console.log(str);
			} else {
				alert(str);
			}
		}
	}
})(jQuery);
