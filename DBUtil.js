//indexDB数据库封装插件
(function(){
	var DBUtil = function(){
        if(this instanceof DBUtil){
            this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB ||window.msIndexedDB;
            this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
            this.db = null;
        }else{
            return new DBUtil();
        }
	}
	DBUtil.prototype = {
		check: function(){
			return this.indexedDB ? true : false;
		},
		connect: function(options, callback){
			var name = options.baseName,
        	    version = options.version || 1,
                tables = options.tables || [];
            if(!tables.length){
                alert('请传入table参数')
                return;
            }
            var checkItem = tables.every(function(item){
                return (item.tableName !== '' && item.tableName !== undefined && item.tableName !== 'undefined' && item.tableName !== null) && ((item.cells||[]).length !== 0)
            });
            var me = this;
            if(!checkItem){
                alert('table参数配置不正确，请检查tableName Or cells');
                return;
            }
        	//如果数据库存在就打开，如果数据库不存在就去新建
        	var con = me.indexedDB.open(name, version);
            con.onsuccess = function(e){
        		me.db = e.target.result;
        		console.log('Connect db[' + name + '] success! version[' + version + ']');
        		callback && callback(true);
        	}
        	con.onerror = function(e){
            	console.log('Connect db[' + me.name + '] failed!' + e.taeget.errorCode);
        	    callback && callback(false);
            };
        	//创建新数据库，或者数据库版本号被更改的时候触发onupgradeneeded事件，并执行回调函数
			con.onupgradeneeded = function(e){
            	var thisdb = e.target.result;
                for(var i=0,len=tables.length;i<len;i++){
                    //判断是否有这个表的存在
                    var table = tables[i],tableName = table.tableName,cells = table.cells;
                    if(!thisdb.objectStoreNames.contains(tableName)){
                        //如果表格不存在，创建一个新的表（keyPath，主键 ； autoIncrement,是否自增），会返回一个对象（objectStore）
                        var objectStore = thisdb.createObjectStore(tableName,{keyPath:'id',autoIncrement:true});
                        //指定可以被索引的字段，unique字段是否唯一
                        for(var j=0,lenj=cells.length;j<lenj;j++){
                            objectStore.createIndex(cells[j][0],cells[j][0],{unique:cells[j][1]});
                        }
                        console.log('table['+ tableName +'] created success!')
                    }
                }
			};
			return me;
		},
		add: function(tableName, obj, callback){
			var transaction = this.db.transaction(tableName,'readwrite'),res;
			//事物回调函数的处理
			transaction.oncomplete = function(e){
				callback && callback(true);
			}
			transaction.onerror = function(e){
            	callback && callback(false);
        	}
        	//通过事物得到一个objectStore对象
        	var objectStore = transaction.objectStore(tableName);
        	objectStore.add(obj);
		},
		/**
         * 查询
         * @param cell       [哪一字段]
         * @param val        [条件值]
         * @param callback   [回调函数]
         */
		query: function(tableName, cell, val, callback){
			var res = [];
            if(!this.db.objectStoreNames.contains(tableName)){
                alert(tableName + '表不存在');
                callback && callback(res);
                return;
            }
            var transaction = this.db.transaction(tableName,'readonly'),
			    objectStore = transaction.objectStore(tableName),
			    boundKeyRange = this.IDBKeyRange.only(val), //生成一个辨识范围的Range对象
			    me = this;
            //游标与索引相结合的查询，性能优化
            objectStore.index(cell).openCursor(boundKeyRange).onsuccess = function(e){
                var cursor = e.target.result; 
                if(!cursor){
                	callback && callback(res);
                    return;
                }
                res.push(cursor.value);
                //使游标下移，如果到最后娶不到值，返回undefined
                cursor.continue();
            }
		},
		queryAll: function(tableName, callback){
            var res = [];
            if(!this.db.objectStoreNames.contains(tableName)){
                alert(tableName + '表不存在');
                callback && callback(res);
                return;
            }
            var transaction = this.db.transaction(tableName,'readonly'),
            	objectStore = transaction.objectStore(tableName),
            	me = this;
            objectStore.openCursor().onsuccess = function(e){
                var cursor = e.target.result;
                if(!cursor){
                	callback && callback(res);
                    return;
                }
                res.push(cursor.value);
                cursor.continue();
            };
            objectStore.openCursor().onerror = function(e){
                console.log('query Error：' + e);
            }
		},
		// update: function(tableName, queryCell, queryVal, cell, val){
		// 	var transaction = this.db.transaction(tableName,'readwrite'),
  //           	store = transaction.objectStore(tableName);
  //           store.index(queryCell).getAll(queryVal).onsuccess = function(e){
  //           	var arr = e.target.result;
  //           	console.log(arr);
  //           	for(var i=0,len=arr.length;i<len;i++){
  //           		var obj = arr[i];
  //           		obj[cell] = val;
  //           		store.put(obj);
  //           	}            	
  //           };
		// },
        update: function(tableName, queryCell, queryVal, cells){
            var transaction = this.db.transaction(tableName,'readwrite'),
                store = transaction.objectStore(tableName);
            store.index(queryCell).getAll(queryVal).onsuccess = function(e){
                var arr = e.target.result;
                console.log(arr);
                for(var i=0,len=arr.length;i<len;i++){
                    var obj = arr[i];
                    for(var j=0,lenj=cells.length;j<lenj;j++){
                        var cell = cells[j];
                        obj[cell.field] = cell.value;
                    }
                    store.put(obj);
                }               
            };
        },
		deleteRow: function(tableName,key, callback){
			var transaction = this.db.transaction(tableName,'readwrite'),
            	objectStore = transaction.objectStore(tableName),
            	request = objectStore.delete(parseInt(key));
            request.onsuccess = function(e){
            	callback && callback(true);
            };
            request.onerror = function(e){
                callback && callback(false);
            }
		},
        clear: function(tableNames){
            for(var i=0,len=tableNames.length;i<len;i++){
                var tableName = tableNames[i],
                    transaction = this.db.transaction(tableName, 'readwrite');
                transaction.objectStore(tableName).clear();
            }
            
        },
		drop: function(name){
			this.indexedDB.deleteDatabase(name);
			console.log('Drop db[' + name + '] success!');
		}
	}
	window['DBUtil'] = DBUtil;
})();