var pool = require("./dbconfig")
var Promise = require("bluebird");
var numtypes = ["int", "tinyint", "bigint", "double", "decimal", "smalint", "float"];
var strtypeTable = 1
var strtypeType = 2

module.exports.bufferinit = function() {
    return new Promise(function (resolve, reject) {
        var result = {};
        var pros = [];
        var batchsize = pool.batchsize ? pool.batchsize : 20;
        var tblarrs = [];
        var tblarr;
        var buflist = []

        pool.getConnection(function (errz, connz) {
            connz.query('select table_name as tn from information_schema.tables where table_schema = "' + pool.database + '"', [], function (erry, rsy) {
                if (erry) {
                    reject()
                    return
                }
                if (pool.buflist == undefined || pool.buflist.length == 0) {
                    for (var i in rsy) {
                        if (i % batchsize == 0) {
                            if (i > 0) {
                                tblarrs.push(tblarr)
                            }
                            tblarr = []
                        }
                        tblarr.push(rsy[i].tn)
                    }
                    tblarrs.push(tblarr);
                } else {
                    for (var i in pool.buflist) {
                        if (i % batchsize == 0) {
                            if (i > 0) {
                                tblarrs.push(tblarr);
                            }
                            tblarr = [];
                        }
                        tblarr.push(pool.buflist[i]);
                    }
                    tblarrs.push(tblarr);
                }

                var sselectdef = "select table_name as tn, column_name as cn, column_type as ct, data_type as dt, column_key as ck";
                var sfromdef = " from information_schema.columns";
                var swheredef;
                for (var i in tblarrs) {
                    tblarr = tblarrs[i];
                    swheredef = " where table_name in (";
                    for (var j in tblarr) {
                        swheredef = swheredef + "'" + tblarr[j] + "', ";
                    }
                    swheredef = swheredef.substr(0, swheredef.length - 2) + ") order by tn";
                    ssqldef = sselectdef + sfromdef + swheredef;

                    pros.push(function (pSql) {
                        return new Promise(function (resolve1, reject1) {
                            pool.getConnection(function (err, conn) {
                                conn.query(pSql, [], function (err1, rs) {
                                    if (err1) {
                                        reject(err1);
                                    } else {
                                        var cols = {};
                                        var pricols = [];
                                        var swhere = " where ";
                                        var sselect = "select ";
                                        var sfrom = "";

                                        var currtn;
                                        var lasttn = "";
                                        for (var j in rs) {
                                            currtn = rs[j].tn;
                                            if (currtn != lasttn) {
                                                if (j > 0) {
                                                    swhere = swhere.substr(0, swhere.length - 4);
                                                    sselect = sselect.substr(0, sselect.length - 2);
                                                    sfrom = " from " + lasttn;
                                                    result[lasttn] = {};
                                                    result[lasttn]["strtype"] = strtypeTable
                                                    result[lasttn]["cols"] = cols;
                                                    result[lasttn]["swhere"] = swhere;
                                                    result[lasttn]["sselect"] = sselect;
                                                    result[lasttn]["sfrom"] = sfrom;
                                                    result[lasttn]["pricols"] = pricols;
                                                }

                                                cols = {};
                                                pricols = [];
                                                swhere = " where ";
                                                sselect = "select ";
                                            }
                                            cols[rs[j].cn] = rs[j];
                                            if (rs[j].ck.toLowerCase() == "pri") {
                                                swhere = swhere + " " + rs[j].cn + " = ? and ";
                                                pricols.push(rs[j].cn);
                                            }
                                            sselect = sselect + rs[j].cn + ", ";
                                            lasttn = currtn;
                                        }
                                        swhere = swhere.substr(0, swhere.length - 4);
                                        sselect = sselect.substr(0, sselect.length - 2);
                                        sfrom = " from " + lasttn;
                                        result[lasttn] = {};
                                        result[lasttn]["strtype"] = strtypeTable
                                        result[lasttn]["cols"] = cols;
                                        result[lasttn]["swhere"] = swhere;
                                        result[lasttn]["sselect"] = sselect;
                                        result[lasttn]["sfrom"] = sfrom;
                                        result[lasttn]["pricols"] = pricols;
                                        resolve1();
                                    }
                                })
                            })
                        })
                    }(ssqldef))
                }
                Promise.all(pros).then(function () {
                    module.exports.tbldefs = result
                    resolve();
                }).catch(function (errs) {
                    console.log(errs + " in error");
                    reject(errs)
                })
            })
        })
    })
}

module.exports.bufferinit().then(function (value) {
    module.exports.defType = typeDef
    module.exports.getone = getone
    module.exports.getmany = getmany
    module.exports.getbytype = getbytype
    module.exports.manybymany = manybymany
    module.exports.refreshByKey = refreshByKey
    module.exports.refreshone = refreshone
    module.exports.saveone = saveone
    module.exports.savemany = savemany
})

var typeDef = function (typename, flds) {
    var tbldefs = module.exports.tbldefs
    try {
        if (tbldefs[typename] != undefined) {
            throw typename + " is defined already"
        } else {
            // var sselect = "select "
            // var sfrom = " from "
            var typecols = []
            for (var i in flds) {
                // sselect = sselect + flds[i].cn + ", "
                if (flds[i].ref) {
                    if (!tbldefs) {
                        throw "Please specify tables definition object";
                    }
                    var aref = flds[i].ref.split(".");
                    var tbl = aref[0];
                    var fld = aref[1];
                    typecols.push(tbldefs[tbl]['cols'][fld])
                } else {
                    if (!flds[i].dt) {
                        throw "Please either refering to db definition or define datatype with 'dt' for field " + flds[i].cn;
                    }
                    if (!flds[i].ct) {
                        throw "Please either refering to db definition or define datatype with 'ct' for field " + flds[i].cn;
                    }
                    typecols.push(flds[i])
                }
            }
            // sselect = sselect.substr(0, sselect.length - 2);
            tbldefs[typename] = {};
            tbldefs[typename]["strtype"] = strtypeType
            // tbldefs[typename]["sselect"] = sselect;
            tbldefs[typename]["cols"] = typecols;
            return tbldefs[typename]
        }
    } catch (e) {
        throw e
    }
}
var getone = function (tn, objkey) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        pool.getConnection(function (err, conn) {
            if (err) {
                reject(err);
            } else {
                var ssql = tbldef["sselect"] + tbldef["sfrom"] + tbldef.swhere;
                var keyarr = []
                if (objkey[0] != undefined) {
                    keyarr = objkey
                } else {
                    for (var i in tbldef['pricols']) {
                        keyarr.push(objkey[tbldef['pricols'][i]])
                    }
                }
                conn.query(ssql, keyarr, function (err1, rs) {
                    if (err1) {
                        reject(err1);
                    } else {
                        if (rs && rs.length > 0) {
                            resolve(rs[0]);
                        } else {
                            reject('nothing found');
                        }
                    }
                })
            }
        })
    })
}
var getmany = function (tn, sfilter) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        pool.getConnection(function (err, conn) {
            if (err) {
                reject(err);
            } else {
                if (tbldef.strtype = strtypeType) {
                    reject('This function only table type supported right now')
                    return
                }
                var ssql = tbldef["sselect"] + tbldef["sfrom"] + sfilter;
                conn.query(ssql, [], function (err1, rs) {
                    if (err1) {
                        reject(err1);
                    } else {
                        resolve(rs);
                    }
                })
            }
        })
    })
}
var getbytype = function (typename, ssql) {
    return new Promise(function (resolve, reject) {
        var def = module.exports.tbldefs[typename]
        var result = []
        var one
        pool.getConnection(function (err, conn) {
            conn.query(ssql, [], function (err, rs, fs) {
                if (err) {
                    reject(err);
                } else {
                    console.log('fs: ' + JSON.stringify(fs))
                    for (var i in rs) {
                        one = {}
                        for (var cn in def.cols) {
                            if (rs[i][cn] != undefined) {//? fs.indexOf(cn) > 0?
                                one[cn] = rs[i][cn]
                            }
                        }
                        result.push(one)
                    }
                    resolve(result)
                }
            })
        })
    })
}
//1: Null is smallest. 2: Only default comparator supported and assume Mysql is the same. 3: Customized comparator will be supported in future version.
var manybymany = function (tn, objs, trans, pParaFlds, pIfandor) { //only trans fields will be selected from db according to the condition in parafields and and/or condition
    return new Promise(function (resolve, reject) {
        try {
            var tbldef = module.exports.tbldefs[tn]
            var sselect = "select ";
            var sfrom = " from " + tn;
            var swhere;
            var cols = tbldef["cols"];
            var keycols = tbldef["pricols"];
            for (var i in trans) {
                sselect = sselect + trans[i] + ", ";
            }
            sselect = sselect.substr(0, sselect.length - 2);
            var ifandor = pIfandor ? pIfandor : "false";
            for (var i in objs) {
                var swhereone = "(";
                for (var j in pParaFlds) {
                    var aval = objs[pParaFlds[j]];
                    if (aval && isNaN(aval)) {
                        swhereone = swhereone + pParaFlds[i] + " = '" + objs[pParaFlds[j]] + "' and ";
                    } else if (aval && !isNaN(aval)) {
                        swhereone = swhereone + pParaFlds[i] + " = " + objs[pParaFlds[j]] + " and ";
                    } else {
                        swhereone = swhereone + pParaFlds[i] + " is null and "
                    }
                }
                if (ifandor) {
                    swhere = swhere + swhereone.substr(0, swhereone.length - 4) + ") and ";
                } else {
                    swhere = swhere + swhereone.substr(0, swhereone.length - 4) + ") or ";
                }
            }
            swhere = swhere + swhereone.substr(0, swhereone.length - 4);
            var ssql = sselect + sfrom + swhere;
            pool.getConnection(function (err, conn) {
                if (err) {
                    reject(err);
                } else {
                    conn.query(ssql, [], function (err1, rs) {
                        if (err1) {
                            reject(err1);
                        } else {
                            resolve(rs);
                            // result = [];
                            // for (var i in rs) {
                            //   result.push(rs[i]);
                            // }
                            // resolve(result);
                        }
                    })
                }
            })
        }catch (e) {
            console.log('failed in manybymany: ' + e)
            reject(e)
        }
    })
}
var refreshByKey = function (tn, objs, trans, orders, pbatchsize) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        var sselect = "select ";
        var sfrom = " from " + tn;
        var swhere;
        var sorder = " order by "
        var cols = tbldef["cols"];
        var keycols = tbldef["pricols"];
        var swheres = [];
        var lowhighs = [];
        var batchsize = 100;
        if (pbatchsize) {
            batchsize = pbatchsize;
        }
        for (var i in cols) {
            if (trans.indexOf(cols[i].cn) >= 0 || cols[i].ck.toLowerCase() == "pri") {
                sselect = sselect + cols[i].cn + ", ";
            }
            if (cols[i].ck.toLowerCase() == "pri") {
                if (!orders) {
                    sorder = sorder + cols[i].cn + ", "
                }
            }
        }
        sselect = sselect.substr(0, sselect.length - 2);
        if (orders) {
            for (var key in orders) {
                sorder = sorder + key + " " + orders[key] + ", ";
            }
        } else {
            orders = {};
            for (var i in keycols) {
                orders[keycols[i]] = "asc";
            }
        }
        sorder = sorder.substr(0, sorder.length - 2);
        var lowhigh = {};
        lowhigh.low = 0;
        lowhigh.high = 0;
        for (var i in objs) {
            if (isNaN(i)) continue;
            var swhereone;
            swhereone = " (";
            if (i % batchsize == 0) {
                if (i > 0) {
                    lowhigh.high = i - 1;
                    lowhighs.push(lowhigh);
                    swhere = swhere.substring(0, swhere.length - 4);
                    swheres.push(swhere);
                }
                swhere = " where";
                lowhigh = {};
                lowhigh.low = i;
            }
            for (var j in keycols) {
                swhereone = swhereone + keycols[j] + " = '" + objs[i][keycols[j]] + "' and ";
            }
            swhereone = swhereone.substr(0, swhereone.length - 4) + ")";
            swhere = swhere + swhereone + " or ";
        }
        swhere = swhere.substring(0, swhere.length - 4);
        lowhigh.high = objs.length - 1;
        lowhighs.push(lowhigh);
        swheres.push(swhere);
        var promises = [];
        for (var i in swheres) {
            promises.push(function (pI) {
                return new Promise(function (resolve1, reject1) {
                    pool.getConnection(function (err, conn) {
                        if (err) {
                            reject(err);
                        } else {
                            var ssql = sselect + sfrom + swheres[pI] + sorder;
                            conn.query(ssql, [], function (err1, rs) {
                                if (err1) {
                                    reject(err1);
                                } else {
                                    try {
                                        var objslice = objs.slice(lowhighs[pI].low, lowhighs[pI].high);
                                        var rsj = 0;
                                        var j = 0;
                                        outer:
                                            while (j < objslice.length) {
                                                var eq = true;
                                                for (var eqj in keycols) {
                                                    eq = eq && (objslice[j][keycols[eqj]] == rs[rsj][keycols[eqj]]);
                                                }
                                                if (eq) {
                                                    for (var k in trans) {
                                                        objslice[j][trans[k]] = rs[rsj][trans[k]];
                                                    }
                                                    rsj++;
                                                    j++;
                                                } else {
                                                    while (true) {
                                                        if (rsj >= rs.length) {
                                                            break outer;
                                                        }
                                                        var eq1 = true;
                                                        for (var eqj1 in keycols) {
                                                            eq1 = eq1 && (objslice[j][keycols[eqj1]] == rs[rsj][keycols[eqj]]);
                                                        }
                                                        if (eq1) {
                                                            for (var k in trans) {
                                                                objslice[j][trans[k]] = rs[rsj][trans[k]];
                                                            }
                                                            rsj++;
                                                            j++;
                                                            break;
                                                        } else {
                                                            var objbigger = false;
                                                            for (var eqj in keycols) {
                                                                if (!objslice[j][keycols[eqj]] && !rs[rsj][keycols[eqj]]) {
                                                                    continue;
                                                                } else if (!objslice[j][keycols[eqj]] && rs[rsj][keycols[eqj]]) {
                                                                    objbigger = false;
                                                                    break;
                                                                } else if (objslice[j][keycols[eqj]] && !rs[rsj][keycols[eqj]]) {
                                                                    objbigger = true;
                                                                    break;
                                                                } else if (objslice[j][keycols[eqj]] > rs[rsj][keycols[eqj]]) {
                                                                    objbigger = true;
                                                                    break;
                                                                } else if (objslice[j][keycols[eqj]] < rs[rsj][keycols[eqj]]) {
                                                                    objbigger = false;
                                                                    break;
                                                                }
                                                                if (orders[keycols[eqj]] == "desc") {
                                                                    objbigger = !objbigger;
                                                                }
                                                            }
                                                            if (objbigger) {
                                                                rsj++;
                                                            } else {
                                                                j++;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        resolve1();
                                    } catch (err2) {
                                        reject1(err2);
                                    }
                                }
                            });
                        }
                    })
                })
            }(i));
        }
        Promise.all(promises).then(function (values) {
            resolve(objs);
        }).catch(function (err) {
            console.log(err);
            reject(err);
        });
    })
}
var refreshone = function (tn, one, ptrans) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        var sselect = "select ";
        var sfrom = " from " + tn;
        var swhere = " where ";
        var tblcols = tbldef["cols"];
        var trans = [];
        if (!ptrans) {
            for (var key in one) {
                if (tblcols[key]) {
                    trans.push(key);
                }
            }
        } else {
            for (var key in one) {
                if (tblcols[key] && ptrans.indexOf(key) >= 0) {
                    trans.push(key);
                }
            }
        }
        for (var key in one) {
            if (tblcols[key].ck.toLowerCase() == "pri") {
                if (!one[key]) {
                    swhere = swhere + key + " is null and ";
                } else if (numtypes.indexOf(tblcols[key].dt) < 0) {
                    swhere = swhere + key + " = '" + one[key] + "' and ";
                } else {
                    swhere = swhere + key + " = " + one[key] + " and ";
                }
            }
        }
        for (var i in trans) {
            sselect = sselect + trans[i] + ", ";
        }
        sselect = sselect.substr(0, sselect.length - 2);
        swhere = swhere.substr(0, swhere.length - 4);
        pool.getConnection(function (err, conn) {
            if (err) {
                reject(err);
            } else {
                var ssql = sselect + sfrom + swhere;
                conn.query(ssql, [], function (err1, rs) {
                    if (err1) {
                        console.log('ssql error: ' + err1)
                        reject(err1);
                    } else {
                        for (var j in rs) {
                            for (var i in trans) {
                                one[trans[i]] = rs[j][trans[i]];
                            }
                            resolve(one);
                            return;
                        }
                    }
                })
            }
        })
    })
}
var saveone = function (tn, one) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        var ssinsert = "insert into " + tn
        var sfld = ' ('
        var sval = ' values ('
        var sondup = ' on duplicate key update '
        var cols0 = tbldef["cols"]
        var cols = []
        var colsname = []
        var pricols = tbldef['pricols']
        for (var key in one) {
            if (cols0[key]) {
                cols.push(cols0[key])
                colsname.push(key)
            }
        }
        var keymiss = true
        for (var i in pricols) {
            if (colsname.indexOf(pricols[i]) < 0) {
                keymiss = false
                reject('Key missing for table/key: ' + tn + '/' + pricols[i])
                return
            }
        }

        for (var key in cols0) {
            if (colsname.indexOf(key) < 0) {
                continue
            }
            sfld = sfld + key + ', '
            if (one[key] == undefined || one[key] == null) {
                sval = sval + null + ', '
            } else {
                sval = sval + '"' + one[key] + '", '
            }
        }
        sfld = sfld.substr(0, sfld.length - 2) + ') '
        sval = sval.substr(0, sval.length - 2) + ') '

        for (var key in cols0) {
            if (pricols.indexOf(key) >= 0) {
                continue
            }
            if (colsname.indexOf(key) < 0) {
                sondup = sondup + key + ' = ' + key + ', '
            } else {
                sondup = sondup + key + ' = ' + 'values(' + key + '), '
            }
        }
        sondup = sondup.substr(0, sondup.length - 2)

        var ssql = ssinsert + sfld + sval + sondup
        pool.getConnection(function (err, conn) {
            conn.query(ssql, [], function (err1, rs) {
                if (err1) {
                    console.log('error inserting on duplicate in yorm saveone 508: ' + err1)
                    reject()
                } else {
                    resolve(one)
                }
            })
        })
    })
}
var savemany = function (tn, objs, pbatchsize, dupup) {
    return new Promise(function (resolve, reject) {
        var tbldef = module.exports.tbldefs[tn]
        var ssupdate = "insert into " + tn;
        var sflds = " (";
        var svalueses = 'values ';
        var arrvalueses = [];
        var sondup = " ";
        var batchtsize;
        var tblcols = tbldef["cols"];
        // console.log('objs[0]: ' + JSON.stringify(objs[0]))
        if (!pbatchsize) {
            batchsize = 100;
        } else {
            batchsize = pbatchsize
        }
        if (dupup) {
            sondup = " on duplicate key update "
        }
        for (var key in objs[0]) {
            if (tblcols[key]) {
                sflds = sflds + key + ", ";
                if (dupup) {
                    sondup = sondup + key + " = values(" + key + "), ";
                }
            }
        }
        if (dupup) {
            sondup = sondup.substr(0, sondup.length - 2)
        }
        for (var i in objs) {
            if (isNaN(parseInt(i))) continue;
            if (i % batchsize == 0) {
                if (i > 0) {
                    svalueses = svalueses.substr(0, svalueses.length - 1);
                    arrvalueses.push(svalueses);
                }
                svalueses = " values "
            }
            var one = objs[i];
            var svaluesone = "("
            for (var key in one) {
                if (tblcols[key]) {
                    var dt = tblcols[key].dt;
                    if (one[key]) {
                        if (numtypes.indexOf(dt) < 0) {
                            svaluesone = svaluesone + "'" + one[key] + "', ";
                        } else {
                            if (isNaN(one[key])) {
                                reject(tn + "." + key + " must be numeric. But value encountered: " + one[key]);
                                return
                            }
                            svaluesone = svaluesone + one[key] + ", ";
                        }
                    } else {
                        svaluesone = svaluesone + "null, "
                    }
                }
            }
            svaluesone = svaluesone.substr(0, svaluesone.length - 2) + "),";
            // console.log("svaluesone: " + svaluesone);
            svalueses = svalueses + svaluesone;
        }
        sflds = sflds.substr(0, sflds.length - 2) + ")";
        svalueses = svalueses.substr(0, svalueses.length - 1);
        arrvalueses.push(svalueses);
        var promises = [];
        for (var i in arrvalueses) {
            promises.push(function (pI) {
                return new Promise(function (resolve1, reject1) {
                    var ssql = ssupdate + sflds + arrvalueses[pI] + sondup;
                    // console.log("ssql: " + ssql);
                    pool.getConnection(function (err, conn) {
                        conn.query(ssql, [], function (err1, rs) {
                            if (err1) {
                                reject1(err1 + ssql);
                            } else {
                                resolve1();
                            }
                        })
                    })
                });
            }(i));
        }
        Promise.all(promises).then(function (values) {
            resolve()
        }).catch(function (err2) {
            reject(err2)
        });
    })
};
