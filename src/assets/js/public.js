
/**
 * 定义业务相关的公共方法，或者是全局方法。
 * 1. 全局变量
 * 2. 业务相关的公共方法
 * 3. 全局配置
 * 4. 全局调用
 */

var Services = {};
ServicesConstant = ServicesConstant || {};

ServicesConstant.tpls = {};

/*******************************************
 * 1. 全局变量
 * *****************************************/
ServicesConstant.APP_VERSION = 'v1.0.0.1';
ServicesConstant.APP_NAME = '旅行社管理系统 - Powered by 小二旅游';
ServicesConstant.TEST_DOMAIN = '';
ServicesConstant.imgPrefixUrl = '';
ServicesConstant.tabHistory = [];
ServicesConstant.ajaxNum = 0;
ServicesConstant.layer = {
    width: '100%',
    height: '95%'
}

// static dom
ServicesConstant.DOM = {
    $pageContent: $('.page-content'),
    $mainTab: $('#main-tab'),
    $mainContent: $('#main-content')
};

// event 
ServicesConstant.Event = {
    formChanged: 'form-changed',
    formUnChanged: 'form-un-changed',
};

ServicesConstant.HTTPStatusText = {
    _401: '无权访问:未登录或者会话已过期',
    _403: '服务器拒绝访问',
    _404: '没有找到所请求的服务',
    _413: '请求内容过大',
    _500: '服务器内部错误',
    _501: '服务器未实现该服务',
    _502: '线路不通，无法到达',
    _503: '所请求的服务不可用',
    _504: '网关超时',
    _505: '服务器不支持请求所使用的HTTP版本',
    _unused: '未转化异常'
};

/*******************************************
 * 2. 业务相关的公共方法
 * *****************************************/
/**
 * 加载模块
 * @param  {string} target 模块的key
 * @return {boolean}        true加载成功
 */
Services.load = function(target) {
    // console.info(ServicesConstant.modules[target]);
    seajs.use(ServicesConstant.modules[target], function(module) {
        module.init();
    })
};

/**
 * 加载页面内容
 * @param {string} id   页面ID，用于唯一区分页面
 * @param {string} name 页面的名称，用于描述页面
 * @param {string} html 页面html，页面的内容
 * @return {boolean}  渲染是否正确，true是正确
 */
Services.addPage = function(id, name, html, scope, fn, args, noRefresh) {
    var $page = ServicesConstant.DOM.$mainContent.find('#' + id);

    if ($page.length) {
        // $page.html(html);
        // 
    } else {
        var close = '<i class="ace-icon fa fa-close T-close"></i>';
        if (id == 'res-danmoo') {
            close = '';
        }
        var pane = '<div class="pageParent hidden"><div class="page" id="'+ id + '"></div></div>',
        $tab = $('<li class=""><a data-toggle="tab" href="#'+ id +'"><span>'+ name +'</span>' + close + '</a></li>');

        ServicesConstant.DOM.$mainContent.append(pane);
        ServicesConstant.DOM.$mainTab.append($tab);
    }

    html = this.filterUnAuthAction(html);

    Services.changeTabHistory('#' + id, true);

    ServicesConstant.DOM.$mainContent.find('#' + id).html(html);
    Services.justifyFooterAction();
    var $tab = ServicesConstant.DOM.$mainTab.find('[href="#' + id + '"]').trigger('click'),
        $refresh = noRefresh == 'noRefresh'? '' : IndexFunUtil.$refresh,
        $page = $('#'+id).append($refresh).append(IndexFunUtil.$loading);
    // 定位到当前选中的tab
    Services.justifyTopTabPosition($tab.offset().top);
    Services.updateTitle(name);
    Tools.fixThead();
    $page.find('.T-globalRefresh').on('click', function() {
        if (typeof fn === 'function') {
            if (!(!!args && args.length)) {
                args = [];
            }
            fn.apply(scope, args);
        }
    })
};

/**
 * 定位顶部tab
 * @param  {int} top 需要定位的内容理顶部的高度
 * @return {[type]}     [description]
 */
 
Services.justifyTopTabPosition = function(top) {
    // 34 n
    var $tab = ServicesConstant.DOM.$mainTab,
        curScrollTop = $tab.scrollTop();

    if (top) {
        top = curScrollTop - (72 - top);
    } else {
        top = curScrollTop;
    }
    $tab.scrollTop(Math.round(top/34 +1) * 34);
};

/**
 * 关闭页面
 * @param  {string/int} arg 当是string时，需要关闭ID为arg的page；当为int时，需要在arg毫秒后关闭当前page；当为空时，直接关闭当前的page, 当为一个对象时，遍历对象并关闭所有
 * @return {[type]}     [description]
 */
Services.closePage = function(arg) {
    var $pageTab, type = typeof arg;

    switch(type) {
        case 'string':
            $pageTab = ServicesConstant.DOM.$mainTab.find('a[href="' + arg + '"]');
        break;
        case 'number':
        case 'undefined':
            $pageTab = ServicesConstant.DOM.$mainTab.find('.active');
        break;
        case 'object':
            if (!!arg && arg.length) {
                for (var i = 0; i < arg.length; i++) {
                    arg.eq(i).find('.T-close').trigger('click');
                }
            }
        break;        
        default:break;
    }
    
    if (!!$pageTab && $pageTab.length) {
        if (type === 'number') {
            setTimeout(function() {
                $pageTab.find('.T-close').trigger('click');
            }, arg);
        } else {
            $pageTab.find('.T-close').trigger('click');
        }
    }
};

/**
 * 改变tab打开顺序
 * @param  {[type]}  key   [IDname]
 * @param  {Boolean} isAdd [是否为添加]
 * @return {[type]}        [description]
 */
Services.changeTabHistory = function(key, isAdd) {
    if (!!key) {
        var index = ServicesConstant.tabHistory.indexOf(key);
        if (isAdd) {
            if (index >= 0) {
                if (index != 0) {
                    ServicesConstant.tabHistory.splice(index, 1);
                    ServicesConstant.tabHistory.unshift(key);
                }
            } else {
                ServicesConstant.tabHistory.unshift(key);
            }
        } else if (index >= 0) {
            ServicesConstant.tabHistory.splice(index, 1);
        }
    }
};

/**
 * 调整当前页面中fix-bottom区域的位置
 * @return {[type]}      [description]
 */
Services.justifyFooterAction = function() {
    setTimeout(function() {
        var $container = ServicesConstant.DOM.$pageContent;
        var $page = ServicesConstant.DOM.$mainContent.find('.page').filter(function(index) {
                return $(this).hasClass('active') ? true : false;
            }),
            $pageParent = $page.closest('.pageParent'),
            $fixAction = $page.find('.fix-bottom'),
            scrollBar = 13, n = 0;

        if (!$fixAction.length) return;
        if (!!$pageParent.scrollTop() || !!$pageParent.scrollTop(1).scrollTop() || $pageParent[0].offsetHeight > $pageParent[0].clientHeight) {
            // 存在纵向滚动条
            n = 1;
        }
        $fixAction.css({
            width: ServicesConstant.DOM.$pageContent.outerWidth() - scrollBar *n+'px',
            right: scrollBar * n + 'px'
        });
        if (!!$pageParent.scrollLeft() || !!$pageParent.scrollLeft(1).scrollLeft() || $pageParent[0].offsetHeight > $pageParent[0].clientHeight) {
            // 存在纵向滚动条
            $fixAction.css('bottom', '13px');
            // $page.css('margin-bottom', scrollBar + 'px');
        } else {
            $fixAction.css('bottom', '0');
            // $page.css('margin-bottom', '0');
        }
    }, 0);
};


/**
 * 根据日期和线路产品天数来更新行程列表
 * @param  {[type]} $tab [容器]
 * @param  {[type]} type [类型]
 * @return {[type]}      [description]
 */
Services.updateItineraryList = function($tab, type) {
    var days = $tab.find('[name=productName]').data('days'),
        productItineraryList = $tab.find('[name=productName]').data('content') || [],
        startDate = $tab.find('.T-startDate').eq(0).val(),
        endDate = $tab.find('.T-endDate').eq(0).val(),
        $area = $tab.find('.T-tripplan-area').find('.T-list'),
        $trs = $area.find('tr'),
        dayLen = Tools.getDaysDiff(startDate, endDate) + 1,
        $model = $area.parent().find('.T-day-model');
    var html = [];
    if (!!startDate && !!endDate) {
        for (var i = 0; i < dayLen; i++) {
            var $tmp = $model.clone(false).removeClass('T-day-model hidden T-model');
            if ($trs.length && (i < $trs.length) && type == '1') {
                Tools.setValue($trs.eq(i), 'itineraryDate', Tools.addDate(startDate, i));
                html.push($trs.eq(i));
            } else {
                Tools.setValue($tmp, 'itineraryDate', Tools.addDate(startDate, i));
                if (productItineraryList.length > i) {
                    Tools.setValue($tmp, 'groupType', productItineraryList[i].groupType);
                    Tools.setValue($tmp, 'transport', productItineraryList[i].transport);
                    Tools.setValue($tmp, 'title', productItineraryList[i].title);
                    Tools.setValue($tmp, 'breakfast', productItineraryList[i].breakfast);
                    Tools.setValue($tmp, 'lunch', productItineraryList[i].lunch);
                    Tools.setValue($tmp, 'dinner', productItineraryList[i].dinner);
                    Tools.setValue($tmp, 'hotel', productItineraryList[i].hotel);
                    Tools.setValue($tmp, 'startPosition', productItineraryList[i].startPosition);
                    Tools.setValue($tmp, 'startPositionCode', productItineraryList[i].startPositionCode);
                    Tools.setValue($tmp, 'endPosition', productItineraryList[i].endPosition);
                    Tools.setValue($tmp, 'endPositionCode', productItineraryList[i].endPositionCode);
                }
                html.push($tmp);
            }
        }
        $area.html('');
    }
    for (var i = 0;i < html.length; i++) {
        html[i].appendTo($area);
    }
    var $dics = $area.find('.T-dictionary');
    $dics.each(function(index, el) {
        var $that = $(this);
        Services.bindDictinary($that.data('target'), $that);
    });
    Tools.setDatePicker($area.find('.w-date'));
    $tab.find('.T-tripplan-area table').tableDnD({
        onDragClass:'table-dnd',
        onDragStop: function(table,row){
            Tools.sortItineraryDate(table);
        }
    });  
};

/**
 * 更新title
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
Services.updateTitle = function(name) {
    document.title = name + ' - ' + ServicesConstant.APP_NAME;
};

//判断是否有权限
Services.hasRight = function(rightCode){
    var res = false;
    if (!IndexFunUtil || !IndexFunUtil.rightArray){
        return res;
    }
    var rightList = IndexFunUtil.rightArray;
    codes = (rightCode+'').split('|');  //考虑权限合并的情况

    if(Object.prototype.toString.call(codes) === '[object Array]'){
        codes.forEach(function(code) {
            if (IndexFunUtil.rightArray.indexOf(code) >= 0) {
                res = true;
            }
        });
    }
    return res;
}

/**
 * 过滤未授权操作
 * @param  {object} $obj 过滤授权的jQuery对象
 * @return {[type]}     [description]
 */
Services.filterUnAuthAction = function(obj) {
    var that = this;
    if(!obj){
        return "";
    }
    var $obj = $(obj);
    $obj.find(".R-right").each(function(){
        if(!that.hasRight($(this).data("right"))){
            $(this).remove();
        }
    });
    $obj.filter('.R-right').each(function(){
        if(!that.hasRight($(this).data("right"))){
            $(this).addClass('hidden');
        }
    });
    $obj.find('.R-erpHideShopInfo').each(function(index, el) {
        if (IndexFunUtil.userinfo.isErpHideShopInfo == '1' && IndexFunUtil.userinfo.isErpForceShowShopInfo == '0') {
            $(this).remove();
        }
    });
    $obj.filter('.R-erpHideShopInfo').each(function(index, el) {
        if (IndexFunUtil.userinfo.isErpHideShopInfo == '1' && IndexFunUtil.userinfo.isErpForceShowShopInfo == '0') {
            $(this).addClass('hidden');
        }
    });
    return $obj;
};

/**
 * 绑定子项目
 * @param  {object} $item   item对象
 * @param  {object} info    主体信息，主要是获取Id
 * @param  {object} options 对象
 * @return {[type]}       [description]
 */
Services.bindSubItem = function($item, info, options) {
    // 获取子项目
    $item.each(function(index, el) {
        var emptyObj = {},
            optionCopy = $.extend(emptyObj, options);
        var $obj = $(this), target = $obj.data('target'), idKey = $obj.data('id-key'), extra = $obj.data('extra'),
        id = info.planId;

        if (!!idKey) {
            id = info[idKey];
        }
        optionCopy.extra = extra;

        if (!!target) {
            seajs.use(ServicesConstant.modules[target], function(module) {
                module.init(id, $obj, optionCopy);
            })
        }
    });
};

/**
 * 绑定字典下拉菜单，可输入
 * @param  {string} key  字典的索引
 * @param  {object} $obj 绑定对象
 * @return {[type]}      [description]
 */
Services.bindDictinary = function(key, $obj, isOnlyChoose) {
    var res = ServicesConstant.Dictionary[key],
        arr = [];
    if (!!res && res.length) {
        for (var i = res.length - 1; i >= 0; i--) {
            var list = res[i].split(''),
                pinyin = '';

            for (var j = 0; j < list.length; j++) {
                pinyin += Pinyin(list[j]).substring(0,1);
            }
            var json = {
                value: res[i],
                label: res[i] + '<span class="hide">' + pinyin + '</span>'
            }
            arr.push(json);
        }
        res = arr;
        if (!!res) {
            $obj.each(function(index, el) {

                $(this).autocomplete({
                    source: res,
                    minLength: 0,
                    change: function(event, ui) {
                        if (!ui.item)  {
                            if(isOnlyChoose) {
                                $(this).val('');
                            }
                        }
                    },
                    select: function(event, ui) {
                        var $that = $(this);
                        $that.val(ui.item.value);
                        $that.trigger('change');
                    }
                })
                .on('click', function(event) {
                    event.preventDefault();
                    /* Act on the event */
                    $(this).autocomplete('search', '');
                });

                $(this).data("ui-autocomplete")._renderItem = function (ul, item) {
                    return $("<li></li>")
                    .data("item.autocomplete", item)
                    .append(item.label)
                    .appendTo(ul);
                };
            });
        }
    }
};


/**
 * 绑定自动选项菜单
 * @param  {string} key        菜单对应的关键字
 * @param  {object} $obj       对应的输入框
 * @param  {function} dataFun  请求数据前的处理方法
 * @param  {function} successFun 请求成功后的处理方法
 * @return {[type]}            [description]
 */
Services.bindAutoComplete = function(key, $obj, dataFun, successFun, selectedFun, json, hasSourceData, sourceDataKey, changeFun) {
    if (!!key && $obj.length) {
        var options = Services._processResArgs(key);

        if (!!options) {
            Services._bindAutocomplete(key, $obj, options, dataFun, successFun, selectedFun, json, hasSourceData, sourceDataKey, changeFun);
        }
    }
};

Services._bindAutocomplete = function(key, $obj, options, dataFun, successFun, selectedFun, json, hasSourceData, sourceDataKey, changeFun) {
    $obj.autocomplete({
        minLength:0,
        maxLength: 10,
        width: 300,
        change: function(event, ui) {
            if (!ui.item)  {
                if (!(!!json && json.noClean == 'noClean')) {
                    $(this).val('');
                }
                $(this).next().val('');
                if (typeof changeFun === 'function') {
                    changeFun($obj, ui.item);
                }
            }
        },
        select: function(event, ui) {
            var $that = $(this);
            $that.next().val(ui.item.id);
            // $that.trigger('change');
            if (typeof selectedFun === 'function') {
                selectedFun($obj, ui.item);
            }
            if (typeof options.selectedFun === 'function') {
                options.selectedFun($that, ui.item);
            }
        }
    }).on('click', function(event) {
        event.preventDefault();
        var $that = $(this);
        var data = {};
        if (typeof dataFun === 'function') {
            data = dataFun($obj);

            if (!data) {
                return ;
            }

            if (typeof data != 'object') {
                data = {};
            }
        }
        if (!!hasSourceData) {
            var res = {
                data: {}
            }
            res.data[sourceDataKey] = hasSourceData;
            options.dataKey = sourceDataKey;
            options.itemValue = 'name';
            options.itemId = 'id';
            callBack(res);
        } else {
            var headCompanyId = $obj.closest('tr').find('[name=headCompanyId]').val();
            if (!!headCompanyId && !$obj.hasClass('T-headCompany') && $obj.closest('td').find('.T-contract-resourceId').length > 0) {
                options.url = Tools.build_url('resource/headCompany.do','findResourceListByHeadCompanyIdAndResourceType');
                options.dataKey = 'resourceList';
                options.itemId = 'id';
                options.itemValue = 'name';
                data = {
                    headCompanyId: headCompanyId,
                    resourceType: key
                }
            }
            $.ajax({
                url: options.url,
                type: 'get',
                data: data,
                showLoading: false,
                dataType: 'json',
            })
            .done(function(res) {
                if (Tools.checkAjaxData(res)) {
                    callBack(res);
                }
            });
        }

        function callBack(res) {
            for(var i=0, len = res.data[options.dataKey].length; i< len; i++){
                res.data[options.dataKey][i].id = res.data[options.dataKey][i][options.itemId];
                if (typeof options.itemValue === 'object') {
                    var h = '-';
                    if (!res.data[options.dataKey][i][options.itemValue[0]] || !res.data[options.dataKey][i][options.itemValue[1]]) {
                        h='';
                    }
                    res.data[options.dataKey][i].value = res.data[options.dataKey][i][options.itemValue[0]] + h + res.data[options.dataKey][i][options.itemValue[1]];
                }else {
                    res.data[options.dataKey][i].value = res.data[options.dataKey][i][options.itemValue];
                }
                var list = res.data[options.dataKey][i].value.split(''),
                    pinyin = '';

                for (var j = 0; j < list.length; j++) {
                    pinyin += Pinyin(list[j]).substring(0,1);
                }

                res.data[options.dataKey][i].label = res.data[options.dataKey][i].value + '<span class="hide">' + pinyin+'</span>';

                if (typeof options.itemValue === 'object' && options.itemValue[1] == 'customerOrderNumber') {
                    if (!!res.data[options.dataKey][i][options.itemValue[0]]) {
                        res.data[options.dataKey][i].label = res.data[options.dataKey][i][options.itemValue[0]] + '<span class="hide">' + pinyin+'</span>';
                    } else {
                        res.data[options.dataKey][i].label = res.data[options.dataKey][i][options.itemValue[1]] + '<span class="hide">' + pinyin+'</span>';
                    }
                }
            }
            if ($obj.closest('.search-area').length) {
                res.data[options.dataKey].unshift({id:'', value: '全部'});
            }

            if (res.data[options.dataKey].length) {
                $obj.autocomplete('option', 'source', res.data[options.dataKey]);
                $obj.autocomplete('search', '');
            } else {
                layer.tips('无数据', $obj, {
                    tips: [1, '#3595CC'],
                    time: 3000
                });
            }

            if (typeof successFun === 'function') {
                successFun($obj, res.data, event);
            }
        }
    });
    
    $obj.data("ui-autocomplete")._renderItem = function (ul, item) {
        return $("<li></li>")
            .data("item.autocomplete", item)
            .append(item.label)
            .appendTo(ul);
    };
};

ServicesConstant.tpls.options = '{{each list as item}} <option value="{{item.id}}" {{if item.selected}} data-id="{{item.saveId}}" selected{{/if}}>{{item.name}}</option>{{/each}}';
ServicesConstant.tpls.scenicOptions = '{{each list as item}} <option value="{{item.name}}" {{if item.selected}} data-id="{{item.name}}" selected{{/if}}>{{item.name}}</option>{{/each}}';
Services.buildMutilChosenOption = function(key, $obj, judgeType) {
    var res = "";

    if (!!key && $obj.length) {
        var options = Services._processResArgs(key);

        if (!!options) {
            $obj.one('chosen:showing_dropdown', function(event) {
                $.ajax({
                    url: options.url,
                    type: 'POST',
                    dataType: 'json',
                })
                .done(function(res) {
                    if (Tools.checkAjaxData(res)) {
                        res.data.list = res.data[options.dataKey];
                        $obj.find('option').each(function(index, el) {
                            var $that = $(this), value = $that.attr('value'),
                                id = $that.data('id');
                            if (!!id && typeof id === 'string') {
                                id = id.trim();
                            }
                            $.each(res.data.list, function(index, val) {
                                var valValue = judgeType ? val[judgeType] : val.id
                                if (valValue == value) {
                                    val.selected = true,
                                    val.saveId = id;
                                    return false;
                                }
                            });
                        });
                        var opt = Services.inlineTemplate(judgeType ? ServicesConstant.tpls.scenicOptions : ServicesConstant.tpls.options, res.data);
                        $obj.html(opt).trigger("chosen:updated");
                    }
                });
            });
        }
    }

    return res;
}

/**
 * 会计科目（2级）自动填充
 * @param  {[type]} $container [容器]
 * @param  {[type]} office     [是否为办公会计科目]
 * @return {[type]}            [description]
 */
ServicesConstant.subjectAutocomplete = function($container, office, suffix) {
    if(!suffix) {
        suffix = '';
    }
    var subject = office ? 'officeSubject' : 'subject';
    Services.bindAutoComplete(subject, $container.find('.T-subjectName'+suffix+''),'','', function($obj) {
            $obj.parent().find('.T-secondSubjectName'+suffix+'').val('').end().find('[name=secondSubjectId'+suffix+']').val('');
        },'','','', function($obj) {
            $obj.parent().find('.T-secondSubjectName'+suffix+'').val('').end().find('[name=secondSubjectId'+suffix+']').val('');
        }
    );

    Services.bindAutoComplete("secondSubject", $container.find('.T-secondSubjectName'+suffix+''), function($obj)  {
            return {pid: $obj.parent().find('input[name="subjectId'+suffix+'"]').val()}
        },'', function($obj) {
            $obj.parent().find('.T-thirdSubjectName'+suffix+'').val('').end().find('[name=thirdSubjectId'+suffix+']').val('');
        },'','','', function($obj) {
            $obj.parent().find('.T-thirdSubjectName'+suffix+'').val('').end().find('[name=thirdSubjectId'+suffix+']').val('');
        }
    );

    Services.bindAutoComplete('secondSubject', $container.find('.T-thirdSubjectName'+suffix+''), function($obj) {
        return {pid: $obj.parent().find('input[name="secondSubjectId'+suffix+'"]').val()}
    });
};

/**
 * 查看或者修改 存在二级会计科目的时候，检查该会计科目是否存在父ID， 如果存在则返回父科目和本身
 * @param  {[type]} dataInfo [description]
 * @param  {[type]} options  [description]
 * @return {[type]}          [description]
 */
ServicesConstant.subjectCheck = function(dataInfo, options) {
    $.ajax({
        url: Tools.build_url('system/subject.do','findSubjectInfoList'),
        type: 'POST',
        async: false,
        dataType: 'json',
    })
    .done(function(res) {
        if (!options) {
            var subjectId = dataInfo.cashLog.subjectId,
                subjectId_bottom = dataInfo.cashLog.subjectId_bottom,
                list = res.data.subjectList;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id == subjectId) {
                    if(!!list[i].gid){
                            dataInfo.cashLog.subjectId = list[i].gid;
                            dataInfo.cashLog.subjectName = list[i].gidName;
                            dataInfo.cashLog.secondSubjectId = list[i].pid;
                            dataInfo.cashLog.secondSubjectName = list[i].pidName;
                            dataInfo.cashLog.thirdSubjectId = list[i].id;
                            dataInfo.cashLog.thirdSubjectName = list[i].name;
                    }
                    else{
                        if (!!list[i].pid) {
                            dataInfo.cashLog.subjectId = list[i].pid;
                            dataInfo.cashLog.subjectName = list[i].pidName;
                            dataInfo.cashLog.secondSubjectId = list[i].id;
                            dataInfo.cashLog.secondSubjectName = list[i].name;
                        } else {
                            dataInfo.cashLog.subjectId = list[i].id;
                            dataInfo.cashLog.subjectName = list[i].name;
                        }
                    }
                }

                if(!!subjectId_bottom){
                    if (list[i].id == subjectId_bottom) {
                        if(!!list[i].gid){
                                dataInfo.cashLog.subjectId_bottom = list[i].gid;
                                dataInfo.cashLog.subjectName_bottom = list[i].gidName;
                                dataInfo.cashLog.secondSubjectId_bottom = list[i].pid;
                                dataInfo.cashLog.secondSubjectName_bottom = list[i].pidName;
                                dataInfo.cashLog.thirdSubjectId_bottom = list[i].id;
                                dataInfo.cashLog.thirdSubjectName_bottom = list[i].name;
                        }
                        else{
                            if (!!list[i].pid) {
                                dataInfo.cashLog.subjectId_bottom = list[i].pid;
                                dataInfo.cashLog.subjectName_bottom = list[i].pidName;
                                dataInfo.cashLog.secondSubjectId_bottom = list[i].id;
                                dataInfo.cashLog.secondSubjectName_bottom = list[i].name;
                            } else {
                                dataInfo.cashLog.subjectId_bottom = list[i].id;
                                dataInfo.cashLog.subjectName_bottom = list[i].name;
                            }
                        }
                    }
                }
            }
        } else {
            if (!!options.list) {
                var dataList = dataInfo[options.dataKey];
                for (var j = 0; j < dataList.length; j++) {
                    var subjectId = dataList[j].subjectId,
                        subjectId_bottom = dataList[j].subjectId_bottom,
                        list = res.data.subjectList;
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].id == subjectId) {
                            if(!!list[i].gid){
                                dataList[j].subjectId = list[i].gid;
                                dataList[j].subjectName = list[i].gidName;
                                dataList[j].secondSubjectId = list[i].pid;
                                dataList[j].secondSubjectName = list[i].pidName;
                                dataList[j].thirdSubjectId = list[i].id;
                                dataList[j].thirdSubjectName = list[i].name;
                            }
                            else {
                                if (!!list[i].pid) {
                                    dataList[j].subjectId = list[i].pid;
                                    dataList[j].subjectName = list[i].pidName;
                                    dataList[j].secondSubjectId = list[i].id;
                                    dataList[j].secondSubjectName = list[i].name;
                                } else {
                                    dataList[j].subjectId = list[i].id;
                                    dataList[j].subjectName = list[i].name;
                                }
                            }
                        }

                        if(!!subjectId_bottom) {
                            if (list[i].id == subjectId_bottom) {
                                if(!!list[i].gid){
                                    dataList[j].subjectId_bottom = list[i].gid;
                                    dataList[j].subjectName_bottom = list[i].gidName;
                                    dataList[j].secondSubjectId_bottom = list[i].pid;
                                    dataList[j].secondSubjectName_bottom = list[i].pidName;
                                    dataList[j].thirdSubjectId_bottom = list[i].id;
                                    dataList[j].thirdSubjectName_bottom = list[i].name;
                                }
                                else {
                                    if (!!list[i].pid) {
                                        dataList[j].subjectId_bottom = list[i].pid;
                                        dataList[j].subjectName_bottom = list[i].pidName;
                                        dataList[j].secondSubjectId_bottom = list[i].id;
                                        dataList[j].secondSubjectName_bottom = list[i].name;
                                    } else {
                                        dataList[j].subjectId_bottom = list[i].id;
                                        dataList[j].subjectName_bottom = list[i].name;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * 通过记住光标位置来插入字符串
 * @param {[type]} textObj [description]
 */
Services.setCaret = function (textObj) {
    if (textObj.createTextRange) {
        textObj.caretPos = document.selection.createRange().duplicate();
    }
}
Services.insertAtCaret = function (textObj, textFeildValue) {
    if (document.all) {
        if (textObj.createTextRange && textObj.caretPos) {
            var caretPos = textObj.caretPos;
            return caretPos.text.charAt(caretPos.text.length - 1) == '   ' ? textFeildValue + '   ' : textFeildValue;
        } else {
            return textFeildValue;
        }
    } else {
        if (textObj.setSelectionRange) {
            var rangeStart = textObj.selectionStart;
            var rangeEnd = textObj.selectionEnd;
            var tempStr1 = textObj.value.substring(0, rangeStart);
            var tempStr2 = textObj.value.substring(rangeEnd);
            return tempStr1 + textFeildValue + tempStr2;
        }
    }
}


/**
 * 处理数据资源相关的数据结构
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
Services._processResArgs = function(key) {
    var url, dataKey, itemId, itemValue, width, selectedFun, res = false;

    switch(key) {
        case 'product':
            // 导游
            url = Tools.build_url('resource/product.do', 'findAllProduct'),
            dataKey = 'productList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'guide':
            // 导游
            url = Tools.build_url('resource/guide.do', 'findAllGuide'),
            dataKey = 'guideList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'planGuide':
            // 已安排的导游
            url = Tools.build_url('arrange/plan.do', 'findAllArrangeGuide'),
            dataKey = 'guideList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'planCustomer':
            // 团上的客户
            url = Tools.build_url('arrange/plan.do', 'findAllPlanCustomer'),
            dataKey = 'customerList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'scenic':
            // 景区
            url = Tools.build_url('resource/scenic.do', 'findAllScenic'),
            dataKey = 'scenicList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'hotel':
            // 酒店
            url = Tools.build_url('resource/hotel.do', 'findAllHotel'),
            dataKey = 'hotelList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'restaurant':
            // 餐厅
            url = Tools.build_url('resource/restaurant.do', 'findAllRestaurant'),
            dataKey = 'restaurantList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'busCompany':
            // 车队
            url = Tools.build_url('resource/busCompany.do', 'findAllBusCompany'),
            dataKey = 'busCompanyList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'driver':
            // 司机
            url = Tools.build_url('resource/busCompany.do', 'findAllDriver'),
            dataKey = 'driverList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'bus':
            // 车，车牌号
            url = Tools.build_url('resource/busCompany.do', 'findAllBus'),
            dataKey = 'busList',
            itemId = 'id',
            itemValue = 'licenceNumber';
        break;
        case 'transportCompany':
            // 大交通
            url = Tools.build_url('resource/transportCompany.do', 'findAllTransportCompany'),
            dataKey = 'transportCompanyList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'selfCompany':
            // 自费
            url = Tools.build_url('resource/selfCompany.do', 'findAllSelfCompany'),
            dataKey = 'selfCompanyList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'insurance':
            // 保险
            url = Tools.build_url('resource/insurance.do', 'findAllInsurance'),
            dataKey = 'insuranceList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'shop':
            //购物店
            url = Tools.build_url('resource/shop.do','findAllShop'),
            dataKey = 'shopList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'factory':
            //工厂
            url = Tools.build_url('resource/factory.do','findAllFactory'),
            dataKey = 'factoryList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'customer':
            // 客户
            url = Tools.build_url('resource/customer.do', 'findAllCustomer'),
            dataKey = 'customerList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'sheet':
            // 票据
            url = Tools.build_url('resource/signSheet.do', 'findAllSignSheet'),
            dataKey = 'signSheetList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'subject':
            //会计科目
            url = Tools.build_url('system/subject.do','findAllSubject'),
            dataKey = 'subjectList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'secondSubject':
            //二级会计科目
            url = Tools.build_url('system/subject.do','findAllChildSubject'),
            dataKey = 'subjectList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'officeSubject':
            //二级会计科目
            url = Tools.build_url('office/subject.do','findAllSubject'),
            dataKey = 'subjectList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'headCompany':
            //公司
            url = Tools.build_url('resource/headCompany.do','findAllHeadCompany'),
            dataKey = 'headCompanyList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'bank':
            //银行卡
            url = Tools.build_url('resource/bank.do','findAllBank'),
            dataKey = 'bankList',
            itemId = 'id',
            itemValue = ['bankName', 'accountNumber'],
            width = 260,
            selectedFun = function($that, data) {
                if ($that.parent().find('.T-bankBlance').length) {
                    $that.parent().find('.T-bankBlance').text(' 余额：' + data.blance);
                }
            }
        break;
        case 'transferBank':
            //银行卡
            url = Tools.build_url('resource/bank.do','findAllTransferBank'),
            dataKey = 'bankList',
            itemId = 'id',
            itemValue = ['bankName', 'accountNumber'],
            width = 260,
            selectedFun = function($that, data) {
                if ($that.parent().find('.T-bankBlance').length) {
                    $that.parent().find('.T-bankBlance').text(' 余额：' + data.blance);
                }
            }
        break;
        case 'customerContact':
            url = Tools.build_url('resource/customer.do', 'findAllCustomerContact'),
            dataKey = 'customerContactList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'department':
            url = Tools.build_url('base/department.do', 'findAllDepartment'),
            dataKey = 'departmentList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'childDepartment':
            url = Tools.build_url('base/department.do', 'findAllChildDepartment'),
            dataKey = 'childDepartmentList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'dutyOPUser':
        case 'outOPUser':
        case 'user':
            url = Tools.build_url('base/user.do', 'findAllUser'),
            dataKey = 'userList',
            itemId = 'id',
            itemValue = 'realName';
        break;
        case 'departmentUser':
            url = Tools.build_url('base/user.do', 'findUserList'),
            dataKey = 'userList',
            itemId = 'id',
            itemValue = 'realName';
        break;
        case 'province':
            url = Tools.build_url('base/province.do', 'findAllProvince'),
            dataKey = 'provinceList',
            itemValue = 'name';
        break;
        case 'customerOrderInfo':
            url = Tools.build_url('order/customer.do', 'findAllCustomerTripNumberByPlanId'),
            dataKey = 'customerOrderList',
            itemId = 'customerOrderId',
            itemValue = ['customerTripNumber','customerOrderNumber'];
        break;
        case 'seatBoxType':
            // 大盘类型
            url = Tools.build_url('travel/seatBox.do', 'findAllSeatBoxType'),
            dataKey = 'seatBoxTypeList',
            itemId = 'id',
            itemValue = 'name';
        break;
        case 'busShopGoods':
            // 车购商品
            url = Tools.build_url('busshop/goods/stock.do', 'findAllGoods'),
            dataKey = 'goodsList',
            itemId = 'id',
            itemValue = 'goodsName';
        break;
        case 'busShopGoodsBuyer':
            // 车购提货人
            url = Tools.build_url('busshop/goods/sale.do', 'findAllBuyer'),
            dataKey = 'buyerList',
            itemId = 'id',
            itemValue = 'buyerUserName';
        break;
        case 'storeGoods':
            // 店铺商品
            url = Tools.build_url('store/goods/stock.do', 'findAllGoods'),
            dataKey = 'goodsList',
            itemId = 'id',
            itemValue = 'goodsName';
        break;
        default:break;
    }

    if (!!url) {
        res = {
            url: url,
            dataKey: dataKey,
            itemId: itemId,
            itemValue: itemValue,
            width: width,
            selectedFun: selectedFun
        }
    }

    return res;
}

/**
 * 选择headCompany 处理 resource
 * @param  {object} $tr 安排的tr'对象
 * @return {[type]}     [description]
 */
Services.chooseHeadCompany = function($tab, $obj, resourceType, selectFun, checkFun, creditFn) {
    Services.bindAutoComplete('headCompany', $tab.find('.T-headCompany'), '', '', function($that, data) {
        if (typeof selectFun === 'function') {
            selectFun($that, data);
        }
        var headCompanyId = $tab.find('[name=headCompanyId]').val();
        if (!!headCompanyId) {
            $.ajax({
                url: Tools.build_url('resource/headCompany.do', 'findResourceListByHeadCompanyIdAndResourceType'),
                type: 'POST',
                dataType: 'json',
                data: {
                    headCompanyId: $tab.find('[name=headCompanyId]').val(),
                    resourceType: resourceType
                },
            })
            .done(function(res) {
                $obj.val('').next().val('');
                $obj.off();
                $obj.autocomplete('destroy');
                Services.bindAutoComplete(resourceType, $obj, '', '', function($obj, customer) {
                    if (typeof creditFn === 'function') {
                        creditFn($obj, customer);
                    }
                }, '', res.data.resourceList, 'resourceList');
            });
        } else {
            $obj.val('').next().val('');
            $obj.off();
            $obj.autocomplete('destroy');
            Services.bindAutoComplete(resourceType, $obj, '', '', function($obj, customer) {
                if (typeof creditFn === 'function') {
                    creditFn($obj, customer);
                }
            });
        }
    },'','','',function() {
        $obj.val('').next().val('');
        $obj.off();
        $obj.autocomplete('destroy');
        if (typeof checkFun === 'function') {
            checkFun();
        }
        Services.bindAutoComplete(resourceType, $obj, '', '', function($obj, customer) {
            if (typeof creditFn === 'function') {
                creditFn($obj, customer);
            }
        });
    });
}

/**
 * 获取集团公司下的资源
 * @param  {[type]} headCompanyId [集团公司ID]
 * @param  {[type]} $obj          [资源对象]
 * @param  {[type]} resourceType  [资源类型]
 * @return {[type]}               [description]
 */
Services.getHeadCompanyResourceList = function(headCompanyId, $obj, resourceType) {
    if (!!headCompanyId) {
        $.ajax({
            url: Tools.build_url('resource/headCompany.do', 'findResourceListByHeadCompanyIdAndResourceType'),
            type: 'POST',
            dataType: 'json',
            data: {
                headCompanyId: headCompanyId,
                resourceType: resourceType
            },
        })
        .done(function(res) {
            $obj.val('');
            $obj.next().val('');
            $obj.off();
            Services.bindAutoComplete(resourceType, $obj, '','','','',res.data.resourceList,'resourceList');
        });
    } else {
        $obj.val('');
        $obj.next().val('');
        $obj.off();
        Services.bindAutoComplete(resourceType, $obj);
    }
}

/**
 * 检查行是否可以被保存
 * @param  {object} $tr 安排的tr'对象
 * @return {[type]}     [description]
 */
Services.checkArrange = function($tr, justChange) {
    var res = false;
    //是否只提交发生了变化的行
    if(justChange){
        if($tr.data('changed') != true){
            return false;
        }
    }
    $tr.find('input[type="text"]').each(function(index, el) {
        if ((!!$(this).val() && $(this).attr('name') != 'seqNumber') || $(this).hasClass('onlyGuide'))  {
            res = true;
            return false;
        }
    });
    $tr.find('input[type="hidden"]').each(function(index, el) {
        var $pre = $(this).prev();
        if (!$pre.hasClass('T-user')
            && !$pre.hasClass('T-headCompany')
            && !$pre.hasClass('T-must')
            && !$pre.hasClass('T-ignore')
            && !$pre.hasClass('T-bankNumber')
            && !$pre.hasClass('T-customerOrderInfo')
            && !$pre.hasClass('T-secondSubjectName')
            && !$pre.hasClass('T-itinerary-position')
            && $(this).attr('name') != 'id'
            && $(this).attr('name') != 'isGuideExtra'
            && $(this).attr('name') != 'goodsId'
            && $(this).attr('name') != 'customerOrderId'
            && $(this).attr('name') != 'mTotalMemberRebate'
            && !$(this).closest('tr').find('[name=id]').val()) {
            if ($pre.hasClass('onlyGuide')) {
                res = true;
            } else {
                res = !!$(this).val();
            }
        }
    });
    return res;
};

Services.customFormula = function(formula, $obj) {
    var arr = [
        'guideRealReimbReceiveMoney',
        'price',
        'count',
        'freeCount',
        'childPrice',
        'childCount',
        'childFreeCount',
        'accompanyPrice',
        'accompanyCount',
        'accompanyFreeCount',
        'freeTotal',
        'otherFee',
        'accompanyRebate',
        'guideRate',
        'guideRebateDeduction',
        'driverRate',
        'driverRebateDeduction'
    ],
    data = {};
    for (var i = 0; i < arr.length; i++) {
        var beforeArr = '{' + arr[i] + '}';
        formula = formula.replace(beforeArr, 'data["' + arr[i] + '"]');
        data[arr[i]] = $obj.find('[name=' + arr[i] + ']').val() * 1 || 0;
        if ($obj.find('[name=' + arr[i] + ']').data('inputtype') == 'rate') {
            data[arr[i]] = data[arr[i]] / 100;
        }
    }
    return Math.round(eval(formula));
};

/**
 * 计算金额
 * @param  {object} $obj 当前修改了值的输入框
 * @param  {boolean} isText 是否是读取文本
 * @return {[type]}      [description]
 */
Services.calcPrice = function($obj, isText, calcFreeTotal) {
    var $line = $obj.find('tr'),
        method = isText? 'text': 'val';
    if (!!$line && $line.length) {

        var total = [],//车费
            price = [],//底价
            freePrice = [],//优惠单价
            count = [],//数量
            times = [],
            freeCount = [],// 免去数量
            childPrice = [],//儿童底价
            childFreePrice = [],//儿童优惠单价
            childCount = [],//儿童数量
            childFreeCount = [],// 儿童免去数量
            accompanyPrice = [],//=全陪底价
            accompanyFreePrice = [],//=全陪优惠单价
            accompanyCount = [],//=全陪数量
            accompanyFreeCount = [],// =全陪免去数量
            subsidy = [],
            driverAccompanyPrice = [],//司陪房单价
            driverAccompanyCount = [],//司陪房数量
            otherFee = [],//其他成本
            guideRealReimbReceiveMoney = [],//实收金额
            guideRebate = [],//导佣
            driverRebate = [],//司佣
            accompanyRebate = [],//陪佣
            agencySummaryArry = [],
            agencySummary = 0,
            freeTotalSummary = [],//优惠总额
            summaryArry = [],
            summary = 0,
            sumGuideSign = 0,// 签单成本合计
            sumGuideR = 0,// 签单导佣合计
            sumDriverR = 0,// 签单司佣合计
            sumAccompanyR = 0,// 签单陪佣合计
            sumGuide = 0,// 现付合计
            scenicRSum = 0,// 景区社利合计
            ReimbRSum = 0,// 实收合计
            target;
        $line.each(function(index) {
            var $this = $line.eq(index);
            total[index] = $this.find('[name="total"]')[method]() * 1 || 0;
            price[index] = $this.find('[name="price"]')[method]() * 1 || 0;
            freePrice[index] = $this.find('[name="freePrice"]')[method]() * 1 || 0;
            count[index] = ($this.find('[name="count"]')[method]() || 1) * 1;
            times[index] = ($this.find('[name="times"]')[method]() || 1) * 1;
            freeCount[index] = $this.find('[name="freeCount"]')[method]() * 1 || 0;
            childPrice[index] = $this.find('[name="childPrice"]')[method]() * 1 || 0;
            childFreeCount[index] = $this.find('[name="childFreeCount"]')[method]() * 1 || 0;
            childFreePrice[index] = $this.find('[name="childFreePrice"]')[method]() * 1 || 0;
            childCount[index] = ($this.find('[name="childCount"]')[method]() || 1) * 1;
            otherFee[index] = $this.find('[name="otherFee"]')[method]() * 1 || 0;
            accompanyPrice[index] = $this.find('[name="accompanyPrice"]')[method]() * 1 || 0;
            accompanyFreePrice[index] = $this.find('[name="accompanyFreePrice"]')[method]() * 1 || 0;
            accompanyFreeCount[index] = $this.find('[name="accompanyFreeCount"]')[method]() * 1 || 0;
            accompanyCount[index] = ($this.find('[name="accompanyCount"]')[method]() || 1) * 1;
            driverAccompanyPrice[index] = $this.find('[name="driverAccompanyPrice"]')[method]() * 1 || 0;
            driverAccompanyCount[index] = $this.find('[name="driverAccompanyCount"]')[method]() * 1 || 0;
            otherFee[index] = $this.find('[name="otherFee"]')[method]() * 1 || 0;
            subsidy[index] = $this.find('[name="subsidy"]')[method]() * 1 || 0;
            guideRealReimbReceiveMoney[index] = $this.find('[name="guideRealReimbReceiveMoney"]')[method]() * 1 || 0;
            guideRebate[index] = $this.find('[name="guideRebate"]')[method]() * 1 || 0;
            driverRebate[index] = $this.find('[name="driverRebate"]')[method]() * 1 || 0;
            accompanyRebate[index] = $this.find('[name="accompanyRebate"]')[method]() * 1 || 0;

            if (isNaN(count[index])) { count[index] = 1 }
                if (isNaN(times[index])) { times[index] = 1 }
                    if($this.find('[name="otherFee"]').data("val") === "isotherFee") {
                        otherFee[index] = otherFee[index] * -1;
                    }
                freeTotalSummary[index] = freePrice[index] * (count[index] - freeCount[index]) * times[index]
                                        + childFreePrice[index] * (childCount[index] - childFreeCount[index]) * times[index]
                                        + accompanyFreePrice[index] * (accompanyCount[index] - accompanyFreeCount[index]) * times[index];
                
                summaryArry[index] =  total[index]
                                    + price[index] * (count[index] - freeCount[index])* times[index]
                                    + childPrice[index] * (childCount[index] - childFreeCount[index])* times[index]
                                    + accompanyPrice[index] * (accompanyCount[index] - accompanyFreeCount[index])* times[index]
                                    - subsidy[index]
                                    - freeTotalSummary[index]
                                    + driverAccompanyPrice[index] * driverAccompanyCount[index] 
                                    + otherFee[index];
                // 总利润计算
                if (IndexFunUtil.userinfo.scenicExtraTotalProfitExpression) {
                    // 社利 定制公式
                    var mTotalProfit = Services.customFormula(IndexFunUtil.userinfo.scenicExtraTotalProfitExpression, $this);
                    $this.find('.T-mTotalProfit-summary').text(mTotalProfit);
                    agencySummaryArry[index] = mTotalProfit - guideRebate[index] - driverRebate[index] - accompanyRebate[index];
                } else {
                    /*社利 = 实收金额-（底价*（数量-免去数量）+其他成本）-导佣-司佣-陪佣+其他成本*/
                    agencySummaryArry[index] = guideRealReimbReceiveMoney[index] - (price[index] * (count[index] - freeCount[index]))- guideRebate[index] - driverRebate[index] - accompanyRebate[index] - otherFee[index];
                }
                
                if($($this).find('[name=cashType]').val() === 'guideSign' || $($this).find('[name=cashType]').data('type') === 'guideSign'){
                        sumGuideSign += summaryArry[index];
                        sumGuideR += guideRebate[index];
                        sumDriverR += driverRebate[index];
                        sumAccompanyR += accompanyRebate[index];
                    }
                if($($this).find('[name=cashType]').val() === 'guide'){
                        sumGuide += summaryArry[index];
                    }
                if (calcFreeTotal) {
                    $($this).find('.T-item-freeTotal').val(Tools.toFixed(freeTotalSummary[index])).trigger('change');
                }
                $($this).find('.T-item-summary').text(Tools.toFixed(summaryArry[index]));
                summary += summaryArry[index]*1;
                $line.find('.T-summary').text(Tools.toFixed(summary));

                $($this).find('.T-itemAgency-summary').text(Tools.toFixed(agencySummaryArry[index]));
                agencySummary += agencySummaryArry[index]*1;
                $line.find('.T-agencySummary').text(Tools.toFixed(agencySummary));
            });

        $line.find('.T-sumGuideSign-summary').text(sumGuideSign);
        $line.find('.T-sumGuide-summary').text(sumGuide);
        $line.find('.T-sumGuideR-summary').text(sumGuideR);
        $line.find('.T-sumDriverR-summary').text(sumDriverR);
        $line.find('.T-sumAccompanyR-summary').text(sumAccompanyR);

        if ($obj.find('.T-just-money').length) {
            var $justMoney = $obj.find('.T-just-money');

            $justMoney.each(function(i){
                var $that = $justMoney.eq(i),
                    target = $justMoney.eq(i).data('target');
                var $justArry = $obj.find('.T-just-money').filter(function() {
                    var $this = $(this);
                    if ($this.data('target') == target) {
                        return true;
                    }
                });
                var justSummary = 0;
                $justArry.each(function(j) {
                    justSummary += $justArry.eq(j)[method]() * 1 || 0;
                })

                $obj.find('.T-' + target + '-summary').text(Tools.toFixed(justSummary));

            });
        } else {
            $line.find('.T-price-summary, .T-netpay-summary, .T-collectMoney-summary, .T-collect-summary, .T-guideServiceFee-summary, .T-manage-summary, .T-justMoney-summary').text('0');
        }
    }
};

/**
 * 只根据优惠总额来计算金额
 * @param  {object} $obj 当前修改了值的输入框
 * @param  {boolean} isText 是否是读取文本
 * @return {[type]}      [description]
 */
Services.fTotalcalcPrice = function($obj, isText) {
    var $line = $obj.find('tr'),
        method = isText? 'text': 'val';
    if (!!$line && $line.length) {

        var total = [],//车费
            price = [],//底价
            freePrice = [],//优惠单价
            count = [],//数量
            times = [],
            driverAccompanyPrice = [],//司陪房单价
            driverAccompanyCount = [],//司陪房数量
            otherFee = [],//其他成本
            subsidy = [],
            freeCount = [],//免去数量
            freeTotalSummary = [],//优惠总额
            summaryArry = [],
            summary = 0,
            target,
            sumFreeTotal = 0;
        $line.each(function(index) {
            var $this = $line.eq(index);
            total[index] = $this.find('[name="total"]')[method]() * 1 || 0;
            price[index] = $this.find('[name="price"]')[method]() * 1 || 0;
            freePrice[index] = $this.find('[name="freePrice"]')[method]() * 1 || 0;
            count[index] = ($this.find('[name="count"]')[method]() || 1) * 1;
            times[index] = ($this.find('[name="times"]')[method]() || 1) * 1;
            subsidy[index] = $this.find('[name="subsidy"]')[method]() * 1 || 0;
            freeCount[index] = $this.find('[name="freeCount"]')[method]() * 1 || 0;
            driverAccompanyPrice[index] = $this.find('[name="driverAccompanyPrice"]')[method]() * 1 || 0;
            driverAccompanyCount[index] = $this.find('[name="driverAccompanyCount"]')[method]() * 1 || 0;
            otherFee[index] = $this.find('[name="otherFee"]')[method]() * 1 || 0;
            freeTotalSummary[index] = $this.find('[name="freeTotal"]')[method]() * 1 || 0;

            if (isNaN(count[index])) { count[index] = 1 }
            if (isNaN(times[index])) { times[index] = 1 }
                if($this.find('[name="otherFee"]').data("val") === "isotherFee") {
                    otherFee[index] = otherFee[index] * -1;
                }

                summaryArry[index] = total[index] + price[index] * (count[index] - freeCount[index])* times[index] - subsidy[index] - freeTotalSummary[index] + driverAccompanyPrice[index] * driverAccompanyCount[index] + otherFee[index];
            $($this).find('.T-item-summary').text(Tools.toFixed(summaryArry[index]));
            summary += summaryArry[index]*1;
            $line.find('.T-summary').text(Tools.toFixed(summary));
            sumFreeTotal += freeTotalSummary[index];
        });
        $obj.find('.T-freeTotal-summary').text(sumFreeTotal);
    }
};
/*
 *计算景区社利
 *算法：社利 = 实收金额-（底价*（数量-免去数量）+其他成本）-导佣-司佣-陪佣
 */
Services.RebateSum = function($obj, auditStatus) {
        var $line = $obj.find('tr'),
            method = auditStatus ? 'text': 'val';
        if ($line.find('.T-itemAgency-summary').length) {
            var guideRealReimbReceiveMoney = [],// 实收
                $guideRealReimbReceiveMoney,
                price = [],// 底价
                $price,
                count = [],// 数量
                $count,
                freeCount = [],// 免去数量
                $freeCount,
                guideRebate = [],// 导佣
                $guideRebate,
                driverRebate = [],// 司佣
                $driverRebate,
                accompanyRebate = [],// 陪佣
                $accompanyRebate,
                itemAgency = [],// 社利
                $itemAgency,
                guideRebateSum = 0,// 导佣总计
                driverRebateSum = 0,
                accompanyRebateSum = 0,
                AgencySummary = 0;// 社利总计

            $guideRealReimbReceiveMoney = $obj.find('[name="guideRealReimbReceiveMoney"]');
            $guideRealReimbReceiveMoney.each(function (index) {
                var $this = $guideRealReimbReceiveMoney.eq(index);
                guideRealReimbReceiveMoney.push($this[method]() * 1 || 0);
            })
            $price = $obj.find('[name="price"]');
            $price.each(function (index) {
                var $this = $price.eq(index);
                price.push($this[method]() * 1 || 0);
            })
            $count = $obj.find('[name="count"]');
            $count.each(function (index) {
                var $this = $count.eq(index);
                count.push($this[method]() * 1 || 0);
            })
            $freeCount = $obj.find('[name="freeCount"]');
            $freeCount.each(function (index) {
                var $this = $freeCount.eq(index);
                freeCount.push($this[method]() * 1 || 0);
            })
            $guideRebate = $obj.find('[name="guideRebate"]');
            $guideRebate.each(function (index) {
                var $this = $guideRebate.eq(index);
                guideRebate.push($this[method]() * 1 || 0);
                guideRebateSum += guideRebate[index];
            })
            $driverRebate = $obj.find('[name="driverRebate"]');
            $driverRebate.each(function (index) {
                var $this = $driverRebate.eq(index);
                driverRebate.push($this[method]() * 1 || 0);
                driverRebateSum += driverRebate[index];
            })
            $accompanyRebate = $obj.find('[name="accompanyRebate"]');
            $accompanyRebate.each(function (index) {
                var $this = $accompanyRebate.eq(index);
                accompanyRebate.push($this[method]() * 1 || 0);
                accompanyRebateSum += accompanyRebate[index];
            })
            $itemAgency = $obj.find('.T-itemAgency-summary');
            if (IndexFunUtil.userinfo.scenicExtraTotalProfitExpression) {
                $itemAgency.each(function (index) {
                    var $this = $itemAgency.eq(index),
                        mTotalProfit = Services.customFormula(IndexFunUtil.userinfo.scenicExtraTotalProfitExpression, $this.closest('tr')),
                        val = mTotalProfit - driverRebate[index] - accompanyRebate[index];
                    $this.closest('tr').find('.T-mTotalProfit-summary').text(mTotalProfit);
                    $this.text(val);
                    AgencySummary += val;
                })
            } else {
                $itemAgency.each(function (index) {
                    var $this = $itemAgency.eq(index);
                    itemAgency.push(guideRealReimbReceiveMoney[index] - (price[index] * (count[index] - freeCount[index]))- guideRebate[index] - driverRebate[index] - accompanyRebate[index]);
                    $this.text(itemAgency[index]);
                    AgencySummary += itemAgency[index]*1;
                })
            }

            $obj.find('.T-guideRebateSum').text(guideRebateSum);
            $obj.find('.T-driverRebateSum').text(driverRebateSum);
            $obj.find('.T-accompanyRebateSum').text(accompanyRebateSum);
            $obj.find('.T-AgencySummary').text(AgencySummary);
        } else {
            $line.find('.shopRebateSum, .guideRebateSum, .driverRebateSum, .accompanyRebateSum, .T-AgencySummary, .T-shopRebate-summary, .T-guideRebate-summary, .T-driverRebate-summary, .T-accompanyRebate-summary').text('0');
        }
        
    }
/*
 *计算购物社利
 */
Services.RebateSumCalc = function($obj, auditStatus) {
        var $line = $obj.find('tr'),
            method = auditStatus ? 'text': 'val';
        if ($line.find('.T-shopItemAgency-summary,.T-goodsProfitItem-summary').length) {
            var shopRebateArr = [],
                $shopRebateArr,
                priceArr = [],
                $priceArr,
                buyAmountArr = [],
                $buyAmountArr,
                buyMoneyArr = [],
                $buyMoneyArr,
                $saleDeductionArr,
                saleDeductionArr = [],
                $serviceFeeArr,
                serviceFeeArr = [],
                $expressFeeArr,
                expressFeeArr = [],
                rebateBaseArr = [],
                $rebateBaseArr,
                agencyRebateArr = [],
                $agencyRebateArr,
                introduceUserRebateArr = [],
                $introduceUserRebateArr,
                saleUserRebateArr = [],
                $saleUserRebateArr,
                guideRebateArr = [],
                $guideRebateArr,
                driverRebateArr = [],
                $driverRebateArr,
                accompanyRebateArr = [],
                $accompanyRebateArr,
                itemAgencySummary = [],
                $itemAgencySummary,
                itemGoodsProfitSummary = [],
                $itemGoodsProfitSummary,
                guideRebateSum = 0,
                driverRebateSum = 0,
                accompanyRebateSum = 0,
                shopAgencySummary = 0,
                goodsProfitSummary = 0;

            $shopRebateArr = $obj.find('[name="shopRebate"]');
            $shopRebateArr.each(function (index) {
                var $this = $shopRebateArr.eq(index);
                shopRebateArr.push($this[method]() * 1 || 0);
            })
            $priceArr = $obj.find('[name="price"]');
            $priceArr.each(function (index) {
                var $this = $priceArr.eq(index);
                priceArr.push($this[method]() * 1 || 0);
            })
            $buyAmountArr = $obj.find('[name="buyAmount"]');
            $buyAmountArr.each(function (index) {
                var $this = $buyAmountArr.eq(index);
                buyAmountArr.push($this[method]() * 1 || 0);
            })
            $buyMoneyArr = $obj.find('[name="buyMoney"]');
            $buyMoneyArr.each(function (index) {
                var $this = $buyMoneyArr.eq(index);
                buyMoneyArr.push($this[method]() * 1 || 0);
            })
            $saleDeductionArr = $obj.find('[name="saleDeduction"]');
            $saleDeductionArr.each(function (index) {
                var $this = $saleDeductionArr.eq(index);
                saleDeductionArr.push($this[method]() * 1 || 0);
            })
            $serviceFeeArr = $obj.find('[name="serviceFee"]');
            $serviceFeeArr.each(function (index) {
                var $this = $serviceFeeArr.eq(index);
                serviceFeeArr.push($this[method]() * 1 || 0);
            })
            $expressFeeArr = $obj.find('[name="expressFee"]');
            $expressFeeArr.each(function (index) {
                var $this = $expressFeeArr.eq(index);
                expressFeeArr.push($this[method]() * 1 || 0);
            })
            $rebateBaseArr = $obj.find('[name="rebateBase"]');
            $rebateBaseArr.each(function (index) {
                var $this = $rebateBaseArr.eq(index);
                rebateBaseArr.push($this[method]() * 1 || 0);
            })
            $agencyRebateArr = $obj.find('[name="agencyRebate"]');
            $agencyRebateArr.each(function (index) {
                var $this = $agencyRebateArr.eq(index);
                agencyRebateArr.push($this[method]() * 1 || 0);
            })
            $introduceUserRebateArr = $obj.find('[name="introduceUserRebate"]');
            $introduceUserRebateArr.each(function (index) {
                var $this = $introduceUserRebateArr.eq(index);
                introduceUserRebateArr.push($this[method]() * 1 || 0);
            })
            $saleUserRebateArr = $obj.find('[name="saleUserRebate"]');
            $saleUserRebateArr.each(function (index) {
                var $this = $saleUserRebateArr.eq(index);
                saleUserRebateArr.push($this[method]() * 1 || 0);
            })
            $guideRebateArr = $obj.find('[name="guideRebate"]');
            $guideRebateArr.each(function (index) {
                var $this = $guideRebateArr.eq(index);
                guideRebateArr.push($this[method]() * 1 || 0);
                guideRebateSum += guideRebateArr[index];
            })
            $driverRebateArr = $obj.find('[name="driverRebate"]');
            $driverRebateArr.each(function (index) {
                var $this = $driverRebateArr.eq(index);
                driverRebateArr.push($this[method]() * 1 || 0);
                driverRebateSum += driverRebateArr[index];
            })
            $accompanyRebateArr = $obj.find('[name="accompanyRebate"]');
            $accompanyRebateArr.each(function (index) {
                var $this = $accompanyRebateArr.eq(index);
                accompanyRebateArr.push($this[method]() * 1 || 0);
                accompanyRebateSum += accompanyRebateArr[index];
            })
            $itemAgencySummary = $obj.find('.T-shopItemAgency-summary');
            $itemAgencySummary.each(function (index) {
                var $this = $itemAgencySummary.eq(index);
                itemAgencySummary.push(shopRebateArr[index] - (!!guideRebateArr[index] ? guideRebateArr[index] : 0) - (!!driverRebateArr[index] ? driverRebateArr[index] : 0) - (!!accompanyRebateArr[index] ? accompanyRebateArr[index] : 0));
                $this.text(itemAgencySummary[index]);
                shopAgencySummary += itemAgencySummary[index]*1;
            })
            $itemGoodsProfitSummary = $obj.find('.T-goodsProfitItem-summary');
            $itemGoodsProfitSummary.each(function (index) {
                var $this = $itemGoodsProfitSummary.eq(index);
                itemGoodsProfitSummary.push(buyMoneyArr[index] - serviceFeeArr[index] - expressFeeArr[index] - priceArr[index]*buyAmountArr[index] - agencyRebateArr[index] - (!!guideRebateArr[index] ? guideRebateArr[index] : 0)  - introduceUserRebateArr[index] - saleUserRebateArr[index]);
                $this.text(itemGoodsProfitSummary[index]);
                goodsProfitSummary += itemGoodsProfitSummary[index]*1;
            })

            
            $obj.find('.T-guideRebateSum').text(guideRebateSum);
            $obj.find('.T-driverRebateSum').text(driverRebateSum);
            $obj.find('.T-accompanyRebateSum').text(accompanyRebateSum);
            $obj.find('.T-shopAgencySummary').text(shopAgencySummary);
            $obj.find('.T-goodsProfitSummary').text(goodsProfitSummary);
        } else {
            $line.find('.shopRebateSum, .guideRebateSum, .driverRebateSum, .accompanyRebateSum, .T-shopAgencySummary, .T-goodsProfitSummary, .T-buyMoney-summary, .T-saleDeduction-summary, .T-serviceFee-summary, .T-expressFee-summary, .T-rebateBase-summary, .T-agencyRebate-summary, .T-introduceUserRebate-summary, .T-saleUserRebate-summary, .T-shopRebate-summary, .T-guideRebate-summary, .T-driverRebate-summary, .T-accompanyRebate-summary').text('0');
        }
        Services.clacShopAll($obj);
    }

/**
 *
 *计算协议价
 *
 */
 Services.calcContract = function($that, $container) {
    if (!!$that.val() && $that.val() != '') {
        return;
    }
    var $tr = $container || $that.closest('tr'),
        resourceType = $tr.data('resourcetype'),
        resourceId = $tr.find('.T-contract-resourceId').val(),
        orderDate = $tr.find('.T-contract-orderDate').val(),
        orderEndDate = $tr.find('.T-contract-orderEndDate').val(),
        type = $tr.find('.T-contract-type').val(),
        request = $that.data('request'),
        inputType = $that.data('inputtype'),
        count = $tr.find('.T-contract-count').val();
    if (inputType == 'rate') {
        if ($that.closest('div').hasClass('T-goodsDiv')) {
            type = $tr.find('.T-contract-type').eq($that.closest('div').index()).val();
        } else {
            type = $that.closest('tr').find('.T-contract-type').val();
        }
    }
    if (!resourceType || !resourceId || !orderDate) {
        return;
    }
    switch (resourceType) {
        case 'scenic':
        case 'hotel':
        case 'restaurant':
        case 'self_company':
        if ((inputType == 'freeCount' && !count) || !type) {return;}
        break;
        case 'bus_company':
        if (!type || !orderEndDate) {return;}
        break;
        case 'shop':
            if (request == 'findRate' && !type) {
                return;
            }
        break;
    }

    $.ajax({
        url: Tools.build_url('contract/contract.do', request),
        type: 'POST',
        dataType: 'json',
        showLoading: false,
        data: {
            resourceId: resourceId,
            resourceType: resourceType,
            orderDate: orderDate,
            orderEndDate: orderEndDate,
            count: count,
            type: type
        },
    })
    .done(function(res) {
        if (!$that.val() && res.data[inputType] != '') {
            if (inputType != 'rate') {
                var val = res.data[inputType];
                if (inputType == 'guideRate') {
                    val = res.data[inputType]*100;
                }
                $that.val(val).trigger('change');
            } else {
                var $c = $that.closest('tr'),
                    $inputs = $c.find('.T-contract').filter(function(index) {
                        if ($(this).data('inputtype') == 'rate' && !$(this).prop('disabled')) {
                            return true;
                        };
                    });;
                if (!$that.closest('div').hasClass('T-goodsDiv')) {
                    $inputs.each(function(index, el) {
                        var $this = $inputs.eq(index),
                            name = $this.attr('name');
                        if (res.data[name] != '') {
                            $this.val(res.data[name]*100).trigger('change');
                        }
                    });
                } else {
                    $inputs.each(function(index, el) {
                        var $this = $inputs.eq(index),
                            name = $this.attr('name');
                        if (res.data[name] != '' && $this.closest('div').index() == $that.closest('div').index()) {
                            $this.val(res.data[name]*100).trigger('change');
                        }
                    });
                }
            }
        }
    });
    return $that;
 };

/*购物计算*/
 Services.clacShopAll = function($obj) {
    var map = [
        'buyMemberCount',
        'buyMoney',
        'shopRebate',
        'guideRebate',
        'driverRebate',
        'accompanyRebate',
        'mGuideCollect',
        'mTotalMemberRebate',
        'shopItemAgency'
    ]
    for (var i = 0; i < map.length; i++) {
        var $vals = $obj.find('[name=' + map[i] + ']'),
            sum = 0;
        for (var j = 0; j < $vals.length; j++) {
            sum += $vals.eq(j).val() * 1 || 0;
        }
        $obj.find('.' + map[i] + 'Sum').text(sum.toFixed(2));
        if ($vals.length == '0') {
            $obj.find('.' + map[i] + 'Sum').text(0);
        }
    }


    if ($obj.find('.T-resource-statics').length) {
        $obj.find('.T-resource-statics').each(function(index, el) {
            var $that = $(el);
            for (var i = 0; i < map.length; i++) {
                var $vals = $obj.find('.T-' + map[i] + '-' + index),
                    sum = 0;
                for (var j = 0; j < $vals.length; j++) {
                    if ($vals.eq(j)[0].tagName === 'INPUT') {
                        sum += $vals.eq(j).val() * 1 || 0;
                    } else {
                        sum += $vals.eq(j).text() * 1 || 0;
                    }
                }
                $that.find('.T-resource-' + map[i]).text(sum.toFixed(2));
                if ($vals.length == '0') {
                    $that.find('.T-resource-' + map[i]).text(0);
                }
            }
        });
    }
 };

/**
 * 通过复制来新增行
 * @param  {object} $add 复制按钮
 * @return {[type]}      [description]
 */
Services.cloneLine = function($add) {
    if (!$add || $add.length === 0) return false;

    var $table = $add.closest('div').next('table'),
    $line = $table.find('.T-model').clone().removeClass('T-model hidden');

    $table.find('.T-list').append($line);
    return $line;
}

/**
 * 通过复制来新增行 插入在合计之前
 * @param  {object} $add 复制按钮
 * @return {[type]}      [description]
 */
Services.cloneLineBef = function($add) {
    if (!$add || $add.length === 0) return false;
    var $table = $add.closest('div').next('table');

    var $line = $table.find('.T-model').clone().removeClass('T-model hidden');

    $table.find('.T-all').before($line);
    return $line;
}

/**
 * 字符串模板
 * @param  {[type]} source [description]
 * @param  {[type]} option [description]
 * @return {[type]}        [description]
 */
Services.inlineTemplate = function(source, option) {
    var s = source,
        render = template.compile(s),
        html = render(option);
    return html;
}

//查看单据公共方法
Services.viewBillImage = function($obj, title) {
    var titleName = title || '单据图片';
    var tHtml = '<div class="tab-content col-sm-12 clear-both T-viewBillImage">'
                    +'<ul class="billImageDowebok">'
                    +    '{{each images as image}}'
                    +    '<li style="list-style-type: none; float:left; padding:10px;"><span></span><img data-original="{{image.WEB_IMG_URL_BIG}}" src="{{image.WEB_IMG_URL_SMALL}}"></li>'
                    +    '{{/each}}'
                    +'</ul>'
                +'</div>';
    var images = [];
    $obj.children('li').each(function(index, el) {
        var src = $(this).data('src');

        if (!!src) {
            images.push({
                "WEB_IMG_URL_BIG":ServicesConstant.imgPrefixUrl + src,
                "WEB_IMG_URL_SMALL":ServicesConstant.imgPrefixUrl + src +"?imageView2/2/w/150",
            });
        }
    });
    if(images.length == 0) {
        Tools.showMessage("没有查询到单据");
        return;
    }
    var html = Services.inlineTemplate(tHtml, {images: images});
    layer.open({
        type : 1,
        title : titleName,
        skin : 'layui-layer-rim', // 加上边框
        area: [ServicesConstant.layer.width, ServicesConstant.layer.height], // 宽高
        zIndex : 1028,
        content : html,
        scrollbar: false, // 推荐禁用浏览器外部滚动条
        success : function() { 
            $('.billImageDowebok').viewer({
                url: 'data-original',
            });
        }
    });
};

/**
 *刷新当前tab
 */
Services.refreshTab = function(scope, $tab, fn, args) {
};

/**
 * 获取合计数据请求
 * @param  {[type]} url  [地址]
 * @param  {[type]} args [参数]
 * @param  {[type]} $obj [容器]
 * @return {[type]}      [description]
 */
Services.getStatics = function(url, args, $obj) {
    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: {searchJson: JSON.stringify(args)},
    })
    .done(function(res) {
        Services.setStatics($obj, res.data.statics);
    });
}

/**
 * 合计赋值
 * @param {[type]} $obj [description]
 * @param {[type]} data [description]
 */
Services.setStatics = function($obj, data) {
    $obj.find('span').each(function(index, el) {
        var $that = $(this),
            className = $that.attr('class');
        if (!!className) {
            className = className.split('-')[1];
            $that.text(Tools.toFixed(data[className]));
        }
    });
};

/**
 * 查看下账的日志
 * @param  {int} id     记录编号
 * @param  {string} method URL中的方法参数
 * @return {[type]}        [description]
 */
ServicesConstant.tpls.checkLogTable = 
    '<div class="layer-content">'
    + '    <table class="table table-striped table-bordered table-hover">'
    + '        <colgroup><col /><col style="width: 100px;"/><col style="width: 150px;"/></colgroup>'
    + '        <thead>'
    + '            <tr>'
    + '                <th>操作日志</th>'
    + '                <th>操作人</th>'
    + '                <th>操作时间</th>'
    + '            </tr>'
    + '        </thead>'
    + '        <tbody>'
    + '            {{each logList as item}}'
    + '            <tr>'
    + '                <td>{{item.content}}</td>'
    + '                <td>{{item.createRealName}}</td>'
    + '                <td>{{item.createTime}}</td>'
    + '            </tr>'
    + '            {{/each}}'
    + '        </tbody>'
    + '    </table>'
    + '   <div class="fix-bottom">'
    + '       <div class="text-center">'
    + '           <button type="button" class="T-close btn btn-sm btn-default w-100 mar-r20"><i class="fa fa-times ace-icon"></i>关闭</button>'
    + '       </div>'
    + '</div></div> ';
Services.viewCheckLog = function(id, method, url) {
    if (typeof id === 'string' || typeof id === 'number') {
        var args = {
            id: id,
            planId: id
        }
    } else if (typeof id === 'object') {
        var args = id;
    }
    var baseUrl = url || 'order/log.do'
    $.ajax({
        url: Tools.build_url(baseUrl, method),
        type: 'get',
        dataType: 'json',
        data: args,
    })
    .done(function(res) {
        if (Tools.checkAjaxData(res)) {
            if(!res.data || !res.data.logList || res.data.logList.length == 0) {
                Tools.showMessage("没有查询到相关操作记录");
                return;
            }
            var html = Services.inlineTemplate(ServicesConstant.tpls.checkLogTable, res.data);
            layer.open({
                type : 1,
                title : "操作记录",
                skin : 'layui-layer-rim', // 加上边框
                area: [ServicesConstant.layer.width, ServicesConstant.layer.height], // 宽高
                zIndex : 1028,
                content : html,
                scrollbar: false, // 推荐禁用浏览器外部滚动条
                success : function(layero, index) { 
                    $(layero).find('.T-close').on('click', function(event) {
                        event.preventDefault();
                        layer.close(index);
                    });
                }
            });
        }
    });
};

/**
 * 发起小车接送修改申请
 * @param  {[type]} $that     [description]
 * @param  {[type]} shuttleId [description]
 * @return {[type]}           [description]
 */
Services.shuttleModifyApply = function(shuttleId, templateHtml) {
    layer.open({
        title: '修改申请',
        type: 1,
        skin: 'layui-layer-rim',
        area: [ServicesConstant.layer.width, ServicesConstant.layer.height],
        content: '',
        success: function(lay, layIndex) {
            var $layer = $(lay);
            getModifyApplyList();
            $layer.on('click', '.T-add', function() {
                addModifyApply();
            });

            $layer.on('click', '.T-action', function() {
                var $that = $(this),
                    $tr = $that.closest('tr'),
                    id = $tr.data('id'),
                    target = $that.data('target');
                if (target == 'T-send') {
                    $.ajax({
                        url: Tools.build_url('order/shuttle/modifyApply.do','sendModifyApply'),
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            modifyApplyId: id
                        },
                    })
                    .done(function(res) {
                        Tools.showMessage(res.message, 1);
                        getModifyApplyList();
                    });
                    
                } else if (target == 'T-cancelSend') {
                    Tools.showConfirm('确认撤回该修改请求？', function() {
                        $.ajax({
                            url: Tools.build_url('order/shuttle/modifyApply.do','cancelSendModifyApply'),
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                modifyApplyId: id
                            },
                        })
                        .done(function(res) {
                            Tools.showMessage(res.message, 1);
                            getModifyApplyList();
                        });
                    });
                } else if (target == 'T-edit') {
                    addModifyApply();
                } else if (target == 'T-del') {
                    Tools.showConfirm('确认删除该修改请求？', function() {
                        $.ajax({
                            url: Tools.build_url('order/shuttle/modifyApply.do','deleteModifyApply'),
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                modifyApplyId: id
                            },
                        })
                        .done(function(res) {
                            Tools.showMessage(res.message, 1);
                            getModifyApplyList();
                        });
                    });
                }
            });
            function getModifyApplyList() {
                $.ajax({
                    url: Tools.build_url('order/shuttle/modifyApply.do','findModifyApplyList'),
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        shuttleId: shuttleId
                    },
                })
                .done(function(res) {
                    $layer.find('.layui-layer-content').html(templateHtml.shuttleModifyApply(res.data));
                    
                })
            }
            function addModifyApply() {
                $.ajax({
                    url: Tools.build_url('order/shuttle/modifyApply.do', 'findUnConfirmModifyApply'),
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        shuttleId: shuttleId
                    },
                })
                .done(function(updateRes) {
                    layer.open({
                        title: '发起修改申请',
                        type: 1,
                        skin: 'layui-layer-rim',
                        area: [ServicesConstant.layer.width, ServicesConstant.layer.height],
                        content: templateHtml.unConfirmShuttleModifyApply(updateRes.data),
                        success: function(lay2, layIndex2) {
                            var $lay = $(lay2);
                            $lay.find('.T-save').on('click', function() {
                                var modifyApplyJson = [];
                                var $trs = $lay.find('tbody tr');
                                $trs.each(function(index, el) {
                                    var $this = $trs.eq(index);
                                    if ($this.find('input[type=checkbox]').prop('checked')) {
                                        var json = {
                                            modifyApplyType: $this.find('input').eq(0).attr('name')
                                        }
                                        
                                        modifyApplyJson.push($.extend(json, Tools.getAreaArgs($this.closest('tr'))));
                                    }
                                });
                                $.ajax({
                                    url: Tools.build_url('order/shuttle/modifyApply.do','saveModifyApply'),
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {
                                        shuttleId: shuttleId,
                                        modifyApplyJson: JSON.stringify(modifyApplyJson),
                                        id: $lay.find('[name=modifyId]').val()
                                    },
                                })
                                .done(function(res) {
                                    layer.close(layIndex2);
                                    Tools.showMessage(res.message, 1);
                                    getModifyApplyList();
                                });
                            });
                        }
                    });
                });
            }
            
        }
    });
}

/*******************************************
 * 3. 全局配置
 * *****************************************/

// 配置seaJS
seajs.config({
    'base': '/',
    'map': [
        [/^(.*\.(?:css|js))(.*)$/i, '$1?version=' + ServicesConstant.APP_VERSION + '']
    ],
    alias: {
        '$printor': 'plugins/jquery-plugin/jQuery.print.js'
    }
});

// 配置UEditor
if (typeof UE !== 'undefined') {
    UE.Editor.prototype._bkGetActionUrl = UE.Editor.prototype.getActionUrl;
    UE.Editor.prototype.getActionUrl = function(action) {
        if (action == 'uploadimage' || action == 'catchimage') {
            return ''+APP_ROOT+'base.do?method=uploadImage';
        } else {
            return this._bkGetActionUrl.call(this, action);
        }
    };
}

// 重写ajax
/**
 * 根据请求结果获取状态信息
 * @param  {[type]} XMLHttpRequest [description]
 * @return {[type]}                [description]
 */
function getAjaxErrorInfo(XMLHttpRequest) {
    var status = XMLHttpRequest.status;

    try {
        var fixedResponse = XMLHttpRequest.responseText.replace(/\\'/g, "'");
        var jsonObj = JSON.parse(fixedResponse);
        return jsonObj.message;
    } catch (e) {
        if (status > 200) {
            switch (status) {
                case 401:
                    return ServicesConstant.HTTPStatusText._401;
                case 403:
                    return ServicesConstant.HTTPStatusText._403;
                case 404:
                    return ServicesConstant.HTTPStatusText._404;
                case 413:
                    return ServicesConstant.HTTPStatusText._413;
                case 500:
                    return ServicesConstant.HTTPStatusText._500;
                case 501:
                    return ServicesConstant.HTTPStatusText._501;
                case 502:
                    return ServicesConstant.HTTPStatusText._502;
                case 503:
                    return ServicesConstant.HTTPStatusText._503;
                case 504:
                    return ServicesConstant.HTTPStatusText._504;
                case 505:
                    return ServicesConstant.HTTPStatusText._505;
                default:
                    break;
            }
        }
    }

    return ServicesConstant.HTTPStatusText._unused + ':' + status;
}

//重新封装jquery的ajax方法
(function($) {
    //备份jquery的ajax方法

    var _ajax = $.ajax;
    var loadingLayer = '';
    //重写jquery的ajax方法

    $.ajax = function(opt) {
        if (opt.submitType == "json") {
            opt.data = JSON.stringify(opt.data);
            opt.contentType = "application/json";
        }
        //备份opt中error和success方法

        var fn = {
            error: function(XMLHttpRequest, textStatus, errorThrown) {},
            success: function(data, textStatus) {}
        };

        if (opt.error) {
            fn.error = opt.error;
        }
        if (opt.success) {
            fn.success = opt.success;
        }

        //扩展增强处理
        opt = $.extend({}, {
            timeout: 180000,
            cache: false,
            showLoading: true,
            removeLoading: true,
            showError: true,
            dataType: 'json',
            isApp: false
        }, opt);
        $.extend(opt, opt, {
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                //判断是否是当前页面的ajax请求错误

                if (!!XMLHttpRequest && XMLHttpRequest.readyState == 4) {
                    if (opt.showError != false) {
                        var status;
                        try {
                            status = $.parseJSON(XMLHttpRequest.responseText).errorCode;
                        } catch (e) {
                            // console.warn(e)
                            status = XMLHttpRequest.status;
                        }

                        Tools.showMessage(getAjaxErrorInfo(XMLHttpRequest), 0);

                    }
                    fn.error(XMLHttpRequest, textStatus, errorThrown);
                } else {
                    console.info(opt.url + "请求异常:readyState = " + XMLHttpRequest.readyState);
                    Tools.showMessage('服务器开小差了，请您稍后再试', 1);
                }
            },
            beforeSend: function() {
                if (!!opt.showLoading) {
                    ServicesConstant.ajaxNum++;
                }
                if (!!opt.showLoading && ServicesConstant.ajaxNum == "1" && !opt.isApp) {
                    //原用opt.showLoadingFalseLayer
                    // ServicesConstant.loadingIndex= layer.load('1',{
                    //     shade: ['0.1', '#fff'],
                    //     time: 0
                    // });
                    loadingLayer = $('#main-content').find('.page').filter('.active').find('.T-loadingMaskLayer')
                    if (!!$(document).find('.layui-layer-page').length) {
                        loadingLayer.css({
                            position: 'fixed',
                        });
                    } else {
                        loadingLayer.css({
                            position: 'absolute',
                        });
                    }
                    loadingLayer.show();
                }
            },
            success: function(data, textStatus) {
                //若要移除loading,则移除
                if (Tools.checkAjaxData(data)) {
                    fn.success(data, textStatus);
                } else if (!!data && data.success == '0') {
                    Tools.showMessage(data.message, 0);
                }
            },
            complete: function() {
                if (!!opt.showLoading) {
                    ServicesConstant.ajaxNum--;
                }
                if (!!opt.showLoading && !!opt.removeLoading && ServicesConstant.ajaxNum == "0" && !opt.isApp) {
                    if(loadingLayer) {
                        loadingLayer.fadeOut('fast');
                    }
                }
            }
        });
        var res = _ajax(opt);
        var _done = res.done;
        // 接管方法
        res.done = function(fn) {
            _done(function(res) {
                if (Tools.checkAjaxData(res)) {
                    fn(res);
                }
            });
        };
        return res;
    };
})(jQuery);


/**
 * 重写laypage
 * @param  {[object]} options [自定义选项]
 * @return {[type]}         [description]
 */
if (typeof laypage !== 'undefined') {
    var _laypage = laypage;
    laypage = function(options)  {
        var last = options.last || false;
        if (!last) {
            last = options.pages || false;
        }
        // 合并配置
        options = $.extend({},
            {
                skip: true, //是否开启跳页
                skin: '#65a6b7',
                last: last,
                groups: 3 //连续显示分页数
            }, options);

        _laypage(options);
    };
} else {
    console.info('laypage was not loaded!');
}

if (typeof layer !== 'undefined') {
    var _layer = layer.open;
    layer.open = function(options) {
        // 合并配置
        options = $.extend({},
            {
                type: 1,
                skin: 'layui-layer-rim', //加上边框
                zIndex:1028,
                scrollbar: false,
            }, options);

        return _layer(options);
    }
};

$(document).on('settings.ace.chosen', function(e, event_name, event_val) {
    if(event_name != 'sidebar_collapsed') return;
    $('.chosen-select').each(function() {
         var $this = $(this);
         $this.next().css({'width': $this.parent().width()});
    })
});
/*******************************************
 * 4. 全局调用
 * *****************************************/
// 对话框的删除按钮，进行旋转
$('.modal-header').find('button').hover(function() {
    Tools.rotation($(this));
}, function() {
    Tools.rotation($(this));
});

// 初始化字典数据
Services.updateDictionary = function() {
    $.ajax({
        url: Tools.build_url('system/dictionary.do', 'findDictionaryValueList'),
        type: 'get',
        dataType: 'json',
    })
    .done(function(res) {
        if (Tools.checkAjaxData(res)) {
            ServicesConstant.Dictionary = res.data.dictionary;
        }
    });
}

Services.viewCreditMoney = function($obj, customer) {
    $.ajax({
        url: Tools.build_url('resource/customer.do','getCreditMoney'),
        type: 'POST',
        dataType: 'json',
        data: {
            customerId: customer.id
        },
    })
    .done(function(res) {
        $obj.closest('.page')
        .find('.T-customerCredit').show()
        .find('.T-name').text(customer.name)
        .end().find('.T-creditMoney').text(res.data.creditMoney + '元')
        .end().find('.T-remainCreditMoney').text(res.data.remainCreditMoney + '元');
    });
}

/*******************************************
 * 5. 其他
 * *****************************************/

var $conDiaMes = $("#confirm-dialog-message");
var KingServices = {};
 //修改订单
KingServices.updateOrder = function(id, companyId){
    seajs.use(ServicesConstant.modules['newOrder_cus'], function(module){
        module.updateOrder(0, id, {}, companyId);
    });
};
//修改中转订单
KingServices.updateCityOrder = function(id, companyId){
    seajs.use(ServicesConstant.modules['cityOrder_cus'], function(module){
        module.updateCityOrder(0, id, {}, companyId);
    });
};
//修改跟团订单
KingServices.updateTripOrder = function(id, companyId){
    seajs.use(ServicesConstant.modules['tripOrder_cus'], function(module){
        module.updateTripOrder(0, id, {}, companyId);
    });
};

//订单列表
KingServices.orderWaitListRefresh = function(){
    seajs.use(ServicesConstant.modules['orderWait_cus'], function(module){
        module.listMain();
    });
};

//查看订单
 KingServices.viewOrder = function (id, companyId) {
    seajs.use(ServicesConstant.modules['newOrder_cus'], function (module) {
        module.viewOrder(id, companyId);
    });
 };

//查看中转订单
 KingServices.viewCityOrder = function (id, companyId) {
    seajs.use(ServicesConstant.modules['cityOrder_cus'], function (module) {
        module.viewCityOrder(id, companyId);
    });
 };
//查看跟团订单
 KingServices.viewTripOrder = function (id, companyId) {
    seajs.use(ServicesConstant.modules['tripOrder_cus'], function (module) {
        module.viewTripOrder(id, companyId);
    });
 };



/**
 * 批量识别客人证件照
 */
Services.batchCardOCR = function($tab, $that, method, cardType) {
    Tools.dropzone($that, "image/*", function(data){
        var url = data.url,
            original = data.original;
        $.ajax({
            url: Tools.build_url('order/customer.do', method),
            type: 'POST',
            dataType: 'json',
            async: false,
            data: {
                url : url
            },
        })
        .done(function(res) {
            Tools.showMessage(res.message, 1);
            var data = res.data;
            var name = data.name,
                cardNumber = data.cardNumber,
                province = data.province,
                age = data.age,
                gender = data.gender,
                birthday = data.birthday,
                cardFileMd5 = data.cardFileMd5;

            var isExist = false;
            $that.closest('div').next().find('tbody tr').each(function(){
                var _cardNumber = $(this).find("[name=cardNumber]").val();

                if(_cardNumber == cardNumber){
                    isExist = true;
                }
            });
            if(!isExist) {
                $tr = $that.closest('div').next().find('.T-model').clone(false).removeClass('hidden T-model');
                $that.closest('div').next().find('tbody').append($tr);

                $tr.find("[name=name]").val(name);
                $tr.find("[name=cardType]").val(cardType);
                $tr.find("[name=cardNumber]").val(cardNumber);

                $tr.find(".passportPicUrl-upload-area .image-pre").html(''+
                            '<input type="hidden" name="birthday" value="'+birthday+'"/>'+
                            '<input type="hidden" name="province" value="'+province+'"/>'+
                            '<input type="hidden" name="age" value="'+age+'"/>'+
                            '<input type="hidden" name="gender" value="'+gender+'"/>'+
                            '<input type="hidden" name="cardFileMd5" value="'+cardFileMd5+'"/>'+
                            '<input type="hidden" name="passportPicUrl" value="'+original+'"/><a data-fancybox="gallery" class="passportPicUrl-group" href="'+url+'?imageView2/2/w/1000"><img src="'+url+'?imageView2/2/w/30" style="width:30px;height:30px"/></a>&nbsp;&nbsp;<a href="#" class="T-removePassport">[移除]</a>');

                var id = $tr.data('id');

                $tr.on('click', '.T-removePassport', function(){
                    Tools.showConfirm('您确定要移除当前游客的证件照图片？', function() {
                        if(!!id){
                            $.ajax({
                                url: Tools.build_url('order/customer.do', 'removeMemberPassportPic'),
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    id : id
                                },
                            })
                            .done(function(res) {
                                Tools.showMessage(res.message, 1);
                                $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                            });
                        }
                        else{
                            $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                        }
                    });
                });


                Tools.dropzone($tr.find(".btn-upload"),"image/*",function(data) {
                    $tr.find(".passportPicUrl-upload-area .image-pre").html(''+
                            '<input type="hidden" name="passportPicUrl" value="'+data.original+'"/><a data-fancybox="gallery" class="passportPicUrl-group" href="'+data.url+'?imageView2/2/w/1000"><img src="'+data.url+'?imageView2/2/w/30" style="width:30px;height:30px"/></a>&nbsp;&nbsp;<a href="#" class="T-removePassport">[移除]</a>');

                    var id = $tr.data('id');

                    if(!!id){
                        $.ajax({
                            url: Tools.build_url('order/customer.do', 'updateMemberPassportPic'),
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                id : id,
                                passportPicUrl : data.original
                            },
                        })
                        .done(function(res) {
                            Tools.showMessage(res.message, 1);
                        });
                    }

                    $tr.on('click', '.T-removePassport', function(){
                        Tools.showConfirm('您确定要移除当前游客的证件照图片？', function() {
                            if(!!id){
                                $.ajax({
                                    url: Tools.build_url('order/customer.do', 'removeMemberPassportPic'),
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {
                                        id : id
                                    },
                                })
                                .done(function(res) {
                                    Tools.showMessage(res.message, 1);
                                    $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                                });
                            }
                            else{
                                $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                            }
                        });
                    });
                });

                // 更新排序
                Tools.updateMemberIndex($that.closest('div').next().find('tbody'));
                //判断如果没有选择联系人则勾选第一个
                var $contacts = $that.closest('div').next().find('tbody').find('[name=isContact]'),
                    hasNotContact = true;
                $contacts.each(function(index, el) {
                    var $that = $(el);
                    if ($that.prop('checked')) {
                        hasNotContact = false;
                        return;
                    }
                });
                if (hasNotContact) {
                    $contacts.eq(0).prop('checked', true);
                }
            }
        });
    });
};


/**
 * 签证管理菜单批量识别客人证件照
 */
Services.batchPassportTeamOCR = function($tab) {
    var $that = $tab.find(".T-batchPassportOCR");

    Tools.dropzone($that, "image/*", function(data){
        var url = data.url,
            original = data.original;

        $(document).queue("findPassportInfoQueueAjaxRequests", function(){  
            $.ajax({
                url: Tools.build_url('passport/team.do', 'findPassportInfo'),
                type: 'POST',
                dataType: 'json',
                async: false,
                data: {
                    url : url
                },
            })
            .done(function(res) {
                Tools.showMessage(res.message, 1);
                var data = res.data;
                var name = data.name,
                    pinyin = data.pinyin,
                    cardNumber = data.cardNumber,
                    province = data.province,
                    gender = data.gender,
                    birthday = data.birthday,
                    authorityPlace = data.authorityPlace,
                    issueDate = data.issueDate,
                    expiryDate = data.expiryDate,
                    cardFileMd5 = data.cardFileMd5;

                var isExist = false;
                $that.closest('div').next().find('tbody tr').each(function(){
                    var _cardNumber = $(this).find("[name=cardNumber]").val();

                    if(_cardNumber == cardNumber){
                        isExist = true;
                    }
                });
                if(!isExist) {
                    $tr = $that.closest('div').next().find('.T-model').clone(false).removeClass('hidden T-model');
                    $that.closest('div').next().find('tbody').append($tr);

                    $tr.find("[name=chinessName]").val(name);
                    $tr.find("[name=pinyinName]").val(pinyin);
                    $tr.find("[name=cardNumber]").val(cardNumber);
                    $tr.find("[name=gender]").val(gender);
                    $tr.find("[name=birthPlace]").val(province);
                    $tr.find("[name=birthday]").val(birthday);
                    $tr.find("[name=authorityPlace]").val(authorityPlace);
                    $tr.find("[name=issueDate]").val(issueDate);
                    $tr.find("[name=expiryDate]").val(expiryDate);

                    Tools.setDatePicker($tr.find('.w-date'), true);

                    $tr.find(".passportPicUrl-upload-area .image-pre").html(''+
                                '<input type="hidden" name="cardFileMd5" value="'+cardFileMd5+'"/>'+
                                '<input type="hidden" name="passportPicUrl" value="'+original+'"/><a data-fancybox="gallery" class="passportPicUrl-group" href="'+url+'?imageView2/2/w/1000"><img src="'+url+'?imageView2/2/w/30" style="width:30px;height:30px"/></a>&nbsp;&nbsp;<a href="#" class="T-removePassport">[移除]</a>');

                    var id = $tr.data('id');

                    $tr.on('click', '.T-removePassport', function(){
                        Tools.showConfirm('您确定要移除当前游客的证件照图片？', function() {
                            if(!!id){
                                $.ajax({
                                    url: Tools.build_url('order/customer.do', 'removeMemberPassportPic'),
                                    type: 'POST',
                                    dataType: 'json',
                                    data: {
                                        id : id
                                    },
                                })
                                .done(function(res) {
                                    Tools.showMessage(res.message, 1);
                                    $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                                });
                            }
                            else{
                                $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                            }
                        });
                    });


                    Tools.dropzone($tr.find(".btn-upload"),"image/*",function(data) {
                        $tr.find(".passportPicUrl-upload-area .image-pre").html(''+
                                '<input type="hidden" name="passportPicUrl" value="'+data.original+'"/><a data-fancybox="gallery" class="passportPicUrl-group" href="'+data.url+'?imageView2/2/w/1000"><img src="'+data.url+'?imageView2/2/w/30" style="width:30px;height:30px"/></a>&nbsp;&nbsp;<a href="#" class="T-removePassport">[移除]</a>');

                        var id = $tr.data('id');

                        if(!!id){
                            $.ajax({
                                url: Tools.build_url('order/customer.do', 'updateMemberPassportPic'),
                                type: 'POST',
                                dataType: 'json',
                                data: {
                                    id : id,
                                    passportPicUrl : data.original
                                },
                            })
                            .done(function(res) {
                                Tools.showMessage(res.message, 1);
                            });
                        }

                        $tr.on('click', '.T-removePassport', function(){
                            Tools.showConfirm('您确定要移除当前游客的证件照图片？', function() {
                                if(!!id){
                                    $.ajax({
                                        url: Tools.build_url('order/customer.do', 'removeMemberPassportPic'),
                                        type: 'POST',
                                        dataType: 'json',
                                        data: {
                                            id : id
                                        },
                                    })
                                    .done(function(res) {
                                        Tools.showMessage(res.message, 1);
                                        $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                                    });
                                }
                                else{
                                    $tr.find(".passportPicUrl-upload-area .image-pre").html('暂未上传证件照');
                                }
                            });
                        });
                    });

                    // 更新排序
                    Tools.updateMemberIndex($that.closest('div').next().find('tbody'));
                }
            });
        });  
        
    });
};


/**
 * 批量添加客人信息
 * @param  {[type]} $tab [description]
 * @return {[type]}      [description]
 */
 Services.batchInputMember = function($tab) {
    if (typeof IndexFunUtil.userinfo.batchAddMemberType !== 'string') {
        return;
    }
    var custom = !!IndexFunUtil.userinfo.batchAddMemberType ? IndexFunUtil.userinfo.batchAddMemberType.split('|') : [],
        customHtml = '',
        customOption = '';
    for (var i = 0; i < custom.length; i++) {
        customHtml += '<div><label> <input name="memberListType" type="radio" class="ace" value="custom" data-target="'+custom[i]+'"> <span class="lbl"> 自定义格式：'+ custom[i].split(',').join(' ') +'</span></label></div>'
        customOption += '<option value="'+custom[i]+'">自定义格式：'+custom[i].split(',').join(' ')+'</option>'
    }
    var type1 = '姓名,手机,证件类型,证件号',
        type2 = '姓名,手机,身份证号',
        type3 = '姓名,手机',
        type4 = '姓名,身份证号',
        type5 = '姓名,身份证号,手机',
        type6 = '姓名,证件类型,证件号';

    var html =  '<div class="col-sm-12 tab-content" style="margin-bottom: 20px;">'
            +   '<p class="red">* 请选择批量添加格式，用空格隔开，一行一条，将信息粘贴到下面的文本框后，请敲击Enter回车键</p>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="1" data-target="'+type1+'" checked> <span class="lbl"> 常用的格式：'+type1.split(',').join(' ')+'</span></label></div>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="2" data-target="'+type2+'"> <span class="lbl"> 常用的格式：'+type2.split(',').join(' ')+'</span></label></div>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="3" data-target="'+type3+'"> <span class="lbl"> 常用的格式：'+type3.split(',').join(' ')+'</span></label></div>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="4" data-target="'+type4+'"> <span class="lbl"> 常用的格式：'+type4.split(',').join(' ')+'</span></label></div>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="5" data-target="'+type5+'"> <span class="lbl"> 常用的格式：'+type5.split(',').join(' ')+'</span></label></div>'
            +   '<div><label> <input name="memberListType" type="radio" class="ace" value="6" data-target="'+type6+'"> <span class="lbl"> 常用的格式：'+type6.split(',').join(' ')+'</span></label></div>'
            +   customHtml
            +   '<textarea name="memberList" style="width: 100%; height: 300px;"></textarea>'
            +   '<div class="T-formatList" style="margin-top: 30px;"></div>'
            +   '<button type="button" class="T-save btn btn-block btn-sm btn-success"><i class="fa fa-save ace-icon"></i>保存</button>'
            +'</div>';
    var listTmpls = '<p class="clear-both"><input type="text" class="T-memberInfo col-sm-4" style="margin-right: 5px;"> <select class="T-formatType col-sm-3">'
        +   '<option value="">特殊格式请单独选择</option>'
        +   '<option value="'+type1+'">常用的格式：'+type1.split(',').join(' ')+'</option>'
        +   '<option value="'+type2+'">常用的格式：'+type2.split(',').join(' ')+'</option>'
        +   '<option value="'+type3+'">常用的格式：'+type3.split(',').join(' ')+'</option>'
        +   '<option value="'+type4+'">常用的格式：'+type4.split(',').join(' ')+'</option>'
        +   '<option value="'+type5+'">常用的格式：'+type5.split(',').join(' ')+'</option>'
        +   '<option value="'+type6+'">常用的格式：'+type6.split(',').join(' ')+'</option>'
        +   customOption
        +   '</select></p>'
    $tab.off('click.batchInput').on('click.batchInput','.T-batchInput',function() {
        var $that = $(this),
            modelList = [];
        layer.open({
            type: 1,
            title: '批量录入客人',
            skin: 'layui-layer-rim', //加上边框
            area: [ServicesConstant.layer.width, ServicesConstant.layer.height],//宽高
            content: html,
            success: function($layer, index){
                var $layer = $($layer);
                $layer.find('[name=memberList]').on('input', function() {
                    setInput();
                }).on('keydown', function(e) {
                    var ev = document.all ? window.event : e;
                    if(ev.keyCode==13) {
                        setInput();
                    }
                })
                function setInput() {
                    var data = $layer.find('[name=memberList]').val(),
                        pArr = [];
                    if (data != "") {
                        var dataArray = data.split(/\r?\n/);
                        if (dataArray.length > 0) {
                            for (var i = 0; i < dataArray.length; i++) {
                                if (!!dataArray[i]) {
                                    var $p = $(listTmpls).find('.T-memberInfo').val(dataArray[i]).end();
                                    pArr.push($p);
                                }
                            }
                            $layer.find('.T-formatList').html('');
                            for (var i = 0; i < pArr.length; i++) {
                                $layer.find('.T-formatList').append(pArr[i]);
                            }
                        }
                    }else{
                        Tools.showMessage("请输入要添加的数据");
                        $layer.find('.T-formatList').html('');
                    }
                }
                $layer.find('.T-save').on('click', function() {
                    var $list = $layer.find('.T-formatList p'),
                        modelList = [];
                    $list.each(function(index, el) {
                        var $this = $list.eq(index),
                            $model = $that.closest('div').next().find('.T-model').clone(false).removeClass('hidden T-model');
                            memberInfo = $this.find('.T-memberInfo').val().trim().replace(/\s+/g,' ').split(' '),
                            type = $this.find('.T-formatType').val() ? $this.find('.T-formatType').val().split(',') : $layer.find('[name=memberListType]:checked').data('target').split(',');

                        for (var i = 0; i < type.length; i++) {
                            switch (type[i]) {
                                case '姓名':
                                    $model.find('[name=name]').val(memberInfo[i]);
                                break;
                                case '手机':
                                    $model.find('[name=mobileNumber]').val(memberInfo[i]);
                                break;
                                case '身份证号':
                                    $model.find('[name=cardNumber]').val(memberInfo[i]);
                                    $model.find('[name=cardType]').val('身份证');
                                break;
                                case '证件类型':
                                    $model.find('[name=cardType]').val(memberInfo[i]);
                                break;
                                case '证件号':
                                    $model.find('[name=cardNumber]').val(memberInfo[i]);
                                break;
                            }
                            Services.bindDictinary('zhengjian_leixing', $model.find('[name=cardType]'));
                            modelList.push($model);
                        }

                    });
                    for (var i = 0; i < modelList.length; i++) {
                        $that.closest('div').next().find('tbody').append(modelList[i]);
                    }
                    // 更新排序
                    Tools.updateMemberIndex($that.closest('div').next().find('tbody'));
                    //判断如果没有选择联系人则勾选第一个
                    var $contacts = $that.closest('div').next().find('tbody').find('[name=isContact]'),
                        hasNotContact = true;
                    $contacts.each(function(index, el) {
                        var $that = $(el);
                        if ($that.prop('checked')) {
                            hasNotContact = false;
                            return;
                        }
                    });
                    if (hasNotContact) {
                        $contacts.eq(0).prop('checked', true);
                    }

                    layer.close(index);
                    $(window).trigger('resize');
                });
            }
        })
    });
 };

Services.sendBusSystemOrder = function($send, shuttleId, sendData) {
    var shuttleType = '',
        taskType = '';
    sendData.shuttleId = shuttleId;
    switch (sendData.taskType = $send.data('tasktype')) {
        case 'plane':
            taskType = '0';
            break;
        case 'train':
            taskType = '1';
            break;
        case 'city':
            taskType = '2';
            break;
    }
    switch (sendData.shuttleType = $send.data('shuttletype')) {
        case 'pick':
            shuttleType = '0';
            break;
        case 'send':
            shuttleType = '1';
            break;
        case 'city':
            shuttleType = '2';
            break;
    }
    layer.open({
        title: '一键下单',
        area: [ServicesConstant.layer.width, ServicesConstant.layer.height],
        scrollbar: true,
        content: sendData.templateHtml,
        success: function(lay, layIndex) {
            var $layer = $(lay);
            $layer.find('[name=remark]').val(sendData.remark);
            var feiniuTripTypeHtml = '';
            if (shuttleType == '0' && taskType == '0') {
                feiniuTripTypeHtml += '<option value="AirportPickup" data-target="Airport" data-type="starting">接机</option>';
            } else if (shuttleType == '1' && taskType == '1') {
                feiniuTripTypeHtml += '<option value="TrainStationSend" data-target="TrainStation" data-type="destination">送火车</option>';
            } else if (shuttleType == '1' && taskType == '0') {
                feiniuTripTypeHtml += '<option value="AirportSend" data-target="Airport" data-type="destination">送机</option>';
            } else if (shuttleType == '0' && taskType == '1') {
                feiniuTripTypeHtml += '<option value="TrainStationPickup" data-target="TrainStation" data-type="starting">接火车</option>';
            }

            $layer.find('[name=shuttleIdJson]').val(JSON.stringify([{shuttleId: shuttleId}]));
                        
            $layer.find('[name=feiniuTripType]').html(feiniuTripTypeHtml);
            
            $layer.find('.T-chooseCompany').on('click', function() {
                var $this = $(this);
                $.ajax({
                    url: Tools.build_url('link/busSystem/base.do','findAllCompany'),
                    type: 'POST',
                    showLoading: false,
                    dataType: 'json',
                })
                .done(function(res) {
                    if (Tools.checkAjaxData(res)) {
                        var list = res.data.companyList;
                        for (var i = list.length - 1; i >= 0; i--) {
                            list[i].value = list[i].name;
                        }
                        $this.autocomplete({
                            minLength: 0,
                            change: function (event, ui) {
                                if (ui.item === null) {
                                    var $this = $(this),
                                        $parent = $this.closest('tr');
                                    $this.val('');
                                    $this.blur();
                                    $parent.find('[name=companyId]').val('');
                                }
                            },
                            select: function (event, ui) {
                                var $this = $(this),
                                    $parent = $this.closest('tr');
                                $parent.find('[name=companyId]').val(ui.item.companyId);
                                if (ui.item.linkSystemType === 'huochaitouBusSystem') {
                                    getContractSeatPrice(ui.item.companyId);
                                    $layer.find('.T-tuan').show().end().find('.T-feiniu').hide();
                                    $parent.find('[name=companyId]').data('type', '');
                                } else if (ui.item.linkSystemType === 'feiniuBusSystem') {
                                    if (shuttleType === '2') {
                                        Tools.showMessage('飞牛巴士暂时不支持市内中转订单');
                                        $parent.find('[name=companyId]').val('');
                                        $parent.find('[name=companyId]').data('type', '');
                                        return;
                                    } else {
                                        $parent.find('[name=companyId]').data('type', 'feiniu');
                                    }
                                    $layer.find('.T-tuan').hide().end().find('.T-feiniu').show();
                                    $layer.find('[name=feiniuTripType]').trigger('change');
                                }
                            }
                        })
                        $this.autocomplete('option','source', list);
                        $this.autocomplete('search', '');
                    }
                });
            });

            $layer.find('.T-chooseTripType').autocomplete({
                minLength: 0,
                change :function(event, ui){
                    if(ui.item === null){
                        var $this = $(this);
                        $this.val('');
                        $this.blur();
                        $this.closest('div').find('[name=tripTypeId]').val('');
                    }
                },
                select: function (event, ui) {
                    var $this = $(this);
                        $this.closest('div').find('[name=tripTypeId]').val(ui.item.id);
                }
            }).on('click', function () {
                var $this = $(this);
                var companyId = $this.closest('tr').find('[name=companyId]').val();
                if (!!companyId) {
                    $.ajax({
                        url: Tools.build_url('link/busSystem/base.do','findAllTripType'),
                        type: 'POST',
                        showLoading: false,
                        data: {
                            companyId: companyId
                        },
                        success: function (data) { 
                            if (Tools.checkAjaxData(data)) {
                                var tripTypeList = data.tripTypeList;
                                for (var i = 0; i < tripTypeList.length; i++) {
                                    if (tripTypeList[i].position == taskType && tripTypeList[i].type == shuttleType) {
                                        tripTypeList[i].value = tripTypeList[i].name;
                                    }
                                }
                                $this.autocomplete('option','source', tripTypeList);
                                $this.autocomplete('search', '');
                            }
                        }
                    });
                } else {
                    showLayerMessage('请选择车队公司！');
                }
            });

            function getContractSeatPrice(companyId) {
                $.ajax({
                    url: Tools.build_url('link/busSystem/base.do','getContractSeatPrice'),
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        companyId: companyId
                    }
                })
                .done(function(res) {
                    if (Tools.checkAjaxData(res)) {
                        $layer.find('.T-contractSeatPrice').text(res.contractSeatPrice + '元/座');
                    }
                });
            }

            function getShiftTimeSetStation() {
                $.ajax({
                    url: Tools.build_url('shiftQueryAPI.do','queryShiftTime'),
                    type: 'POST',
                    data: {
                        shiftNumber: sendData.shiftNumber,
                        taskType: $send.data('tasktype'),
                        shuttleDate: sendData.shuttleDate
                    },
                    success: function (data) {
                        if (data.querySuccess == '1') {
                            if (data.isNeedChoose == '0') {
                                // shiftDataList
                            } else {
                                var list = data.shiftDataList,
                                    station = data.stationList;
                                if (list && list.length) {
                                    if ($send.data('shuttletype') == 'pick') {
                                        if (list[list.length - 1].endPosition.indexOf('T1') != -1) {
                                            $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('T1') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        } else if (list[list.length - 1].endPosition.indexOf('T2') != -1) {
                                            $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('T2') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        }
                                    } else if ($send.data('shuttletype') == 'send') {
                                        if (list[0].startPosition.indexOf('T1') != -1) {
                                            $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('T1') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        } else if (list[0].startPosition.indexOf('T2') != -1) {
                                            $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('T2') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        }
                                    }
                                }
                                if (station && station.length) {
                                    for (var i = 0; i < station.length; i++) {
                                        if (station[i].stationName == '成都') {
                                            $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('成都站') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        } else if (station[i].stationName == '成都东') {
                                             $layer.find('[name=feiniuPosition]').find('option').each(function(index, el) {
                                                var $that = $(el);
                                                if ($that.text().indexOf('成都东站') != -1) {
                                                    $that.attr('selected', 'selected');
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        } else {
                            // Tools.showConfirm('是否前往百度查询航班号？', function () {
                            //     window.open("https://www.baidu.com/s?wd=" + shiftNumber);
                            // });
                        }
                    }
                });
            }

            $layer.find('[name=priceType]').on('change', function() {
                var $that = $(this),
                    $tr = $that.closest('tr'),
                    value = $that.val();
                if (value == '0') {
                    $tr.find('[name=price]').prop('readonly', false);
                } else if (value == '1') {
                    $tr.find('[name=price]').val('').prop('readonly', true);
                }
            });

            $layer.find('[name=feiniuTripType]').on('change', function() {
                var $that = $(this);
                $.ajax({
                    url: Tools.build_url('link/feiniuSystem/order.do','findDedicatedList'),
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        type: $that.find('option:selected').data('target')
                    },
                })
                .done(function(res) {
                    var list = res.data.dedicatedList,
                        html = '<option value="">请选择</option>';
                    for (var i = 0; i < list.length; i++) {
                        html += '<option data-longitude="' + list[i].longitude + '" data-latitude="' + list[i].latitude + '" data-stationId="' + list[i].station_id + '">' + list[i].name + '</option>'
                    }
                    $layer.find('[name=feiniuPosition]').html(html);
                    getShiftTimeSetStation();
                });

                switch ($that.find('option:selected').data('type')) {
                    case 'starting':
                        $layer.find('.T-tuniu-positionName').text('下车点');
                    break;
                    case 'destination':
                        $layer.find('.T-tuniu-positionName').text('上车点');
                    break;
                    default:
                    break;
                }
                var useTimeHtml = '';

                switch ($that.val()) {
                    case 'AirportPickup':
                        useTimeHtml +=  '<option value="1800000" data-target="after">航班到达后30分钟</option>' +
                                        '<option value="1200000" data-target="after">航班到达后20分钟</option>' +
                                        '<option value="600000" data-target="after">航班到达后10分钟</option>';
                    break;
                    case 'AirportSend':
                        useTimeHtml +=  '<option value="10800000" data-target="before">航班起飞前3个小时</option>' +
                                        '<option value="12600000" data-target="before">航班起飞前3.5个小时</option>' +
                                        '<option value="14400000" data-target="before">航班起飞前4个小时</option>' +
                                        '<option value="16200000" data-target="before">航班起飞前4.5个小时</option>' +
                                        '<option value="18000000" data-target="before">航班起飞前5个小时</option>' +
                                        '<option value="19800000" data-target="before">航班起飞前5.5个小时</option>' +
                                        '<option value="21600000" data-target="before">航班起飞前6个小时</option>' +
                                        '<option value="23400000" data-target="before">航班起飞前6.5个小时</option>' +
                                        '<option value="25200000" data-target="before">航班起飞前7个小时</option>' +
                                        '<option value="27000000" data-target="before">航班起飞前7.5个小时</option>' +
                                        '<option value="28800000" data-target="before">航班起飞前8个小时</option>';
                    break;
                    case 'TrainStationPickup':
                        useTimeHtml +=  '<option value="0" data-target="after">火车到达后准点</option>' +
                                        '<option value="600000" data-target="after">火车到达后10分钟</option>' +
                                        '<option value="1200000" data-target="after">火车到达后20分钟</option>';
                    break;
                    case 'TrainStationSend':
                        useTimeHtml +=  '<option value="9000000" data-target="before">火车出发前2.5小时</option>' +
                                        '<option value="10800000" data-target="before">火车出发前3小时</option>' +
                                        '<option value="12600000" data-target="before">火车出发前3.5小时</option>';
                    break;
                    default:
                    break;
                }
                $layer.find('[name=useTime]').html(useTimeHtml);
            });

            $layer.on('change', '[name=priceType], [name=rideType]', function() {
                var $this = $(this),
                    val = $this.val(),
                    $div = $this.closest('div');
                if (val == 0) {
                    $div.find('.T-action').removeClass('hidden');
                } else if (val == 1) {
                    $div.find('.T-action').addClass('hidden');
                }
            });

            $layer.on('click', '.T-action', function() {
                var $this =$(this),
                    target = $this.data('target');
                if (target == 'T-addShuttle') {
                    addShuttle();
                }
            });

            function addShuttle() {
                sendData.chooseShuttleLayer = true;
                layer.open({
                    title: '添加接送',
                    type: 1,
                    area: [ServicesConstant.layer.width, ServicesConstant.layer.height],
                    content: sendData.shuttleTemplate.list(sendData),
                    success: function(laySelect, laySelectIndex) {
                        var $layerSelect = $(laySelect),
                            shuttleIdJson = JSON.parse($layer.find('[name=shuttleIdJson]').val()),
                            pageNo = 0;

                        var $searchArea = $layerSelect.find('.search-area');
                        getShuttleList();
                        Tools.setDatePicker($searchArea.find('.w-date'), true);
                        Services.bindAutoComplete('product', $searchArea.find('.T-product'));
                        Services.bindAutoComplete('department', $searchArea.find('.T-departmentName'));
                        Services.bindAutoComplete('childDepartment', $searchArea.find('.T-childDepartmentName'), function($obj) {
                            var dId = $searchArea.find('input[name="departmentId"]').val();

                            if (!dId) {
                                Tools.showMessage('请选择部门后再选择子部门');
                                $searchArea.find('input[name="departmentId"]').trigger('click');
                            }
                            return !!dId ? {departmentId: dId} : false;
                        });
                        Services.bindAutoComplete('dutyOPUser', $searchArea.find('.T-dutyOPUserName'));
                        Services.bindAutoComplete('outOPUser', $searchArea.find('.T-outOPUserName'));
                        Services.bindAutoComplete('customer', $searchArea.find('.T-customerName'));

                        $searchArea.on('click', 'button', function(event) {
                            event.preventDefault();
                            var $that = $(this);

                            if ($that.hasClass('search-submit')) {
                                getShuttleList();
                                shuttleIdJson = JSON.parse($layer.find('[name=shuttleIdJson]').val());
                            }
                        });

                        $layerSelect.on('change', '[name=arrangeShuttle-checkBox]', function() {
                            var $that = $(this),
                                $tr = $that.closest('tr'),
                                json = {
                                    shuttleId: $tr.data('shuttleid'),
                                }
                            if ($that.prop('checked')) {
                                shuttleIdJson.push(json);
                            } else {
                                if ($tr.data('shuttleid') == sendData.shuttleId) {
                                    Tools.showMessage('不能取消基础接送！');
                                    $that.prop('checked', true);
                                    return;
                                }
                                for (var i = 0; i < shuttleIdJson.length; i++) {
                                    if (shuttleIdJson[i].shuttleId == json.shuttleId) {
                                        shuttleIdJson.splice(i, 1);
                                    }
                                }
                            }
                        });

                        $layerSelect.find('.T-save').on('click', function() {
                            $layer.find('[name=shuttleIdJson]').val(JSON.stringify(shuttleIdJson));
                            layer.close(laySelectIndex);
                        });

                        function getShuttleList(page) {
                            var args = Tools.getAreaArgs($searchArea);
                            args.pageNo = page || 0;
                            $.ajax({
                                url: Tools.build_url('travel/shuttle.do','findPlanShuttleList'),
                                type: 'POST',
                                dataType: 'json',
                                data: {searchJson: JSON.stringify(args)},
                            })
                            .done(function(res) {
                                // 过滤授权
                                res.data.chooseShuttleLayer = true;
                                var html = Services.filterUnAuthAction(sendData.shuttleTemplate.listTable(res.data));

                                $layerSelect.find('.table-area').html(html);

                                $layerSelect.find('.table-area').find('.T-list tr').each(function(index, el) {
                                    var $that = $(this),
                                        shuttleId = $that.data('shuttleid');
                                    for (var i = 0; i < shuttleIdJson.length; i++) {
                                        if (shuttleIdJson[i].shuttleId == shuttleId) {
                                            $that.find('.T-checkBox').prop('checked', true);
                                        }
                                    }
                                });
                                pageNo = res.data.pageNo;
                                laypage({
                                    cont: $layerSelect.find('.page-area'),
                                    pages: res.data.totalPage, //总页数
                                    curr: (args.pageNo + 1),
                                    jump: function(obj, first) {
                                        if (!first) { // 避免死循环，第一次进入，不调用页面方法
                                            getShuttleList(obj.curr - 1);
                                        }
                                    }
                                });
                                $layerSelect.find('.page-area').append('共计 '+res.data.recordSize + ' 条记录');
                            })
                        }
                    }
                })
            }

            $layer.on('click', '.T-map', function () {
                event.preventDefault();
                var $that = $(this),
                    $parent = $that.closest('tr'),
                    hotelName = $parent.find('[name=hotelName]').val();
                var publicLayer = layer.open({
                    type: 1,
                    title: '从地图选择酒店',
                    skin: 'layui-layer-rim', //加上边框
                    area: [ServicesConstant.layer.width, ServicesConstant.layer.height], //宽高
                    zIndex: 1028,
                    content: sendData.mapTemplate({hotelName: sendData.hotelName}),
                    scrollbar: false,
                    success: function(){
                       var $layerMap = $('.T-mapContent'),
                        listData = '';
                        // 百度地图API功能
                        function G(id) {
                            return document.getElementById(id);
                        }

                        var map = new BMap.Map("l-map");
                        // map.centerAndZoom("成都",11);                   // 初始化地图,设置城市和地图级别。

                        function myFun(result){
                            var cityName = result.name;
                            map.centerAndZoom(cityName,11);
                        }
                        var myCity = new BMap.LocalCity();
                        myCity.get(myFun);

                        // 百度地图API功能
                        var local = new BMap.LocalSearch(map, {
                            renderOptions: {map: map, panel: "r-result"}
                        })
                        local.setMarkersSetCallback(function(pois){
                            listData = pois;
                        });
                        $layerMap.find('#r-result').on('dblclick', 'li', function() {
                            var i = $(this).index(),
                                hotelName = listData[i].title,
                                hotelAddress = listData[i].address;
                                $parent.find('[name=hotelInfo]').val(hotelName + '(' + hotelAddress + ')').data('point', {lat: listData[i].marker.point.lat, lng: listData[i].marker.point.lng});
                            layer.close(publicLayer);
                            getFeiNiuPrice();
                        });
                        local.search(sendData.hotelName);
                        $layerMap.find('.T-searchInput').on('keyup', function () {
                            local.search($(this).val());
                        });
                    }
                });
            });

            $layer.find('[name=rideType]').on('change', function() {
                var $this = $(this),
                    val = $this.val();
                switch (val) {
                    case '0':
                        $.ajax({
                            url: Tools.build_url('link/feiniuSystem/order.do','findBusTypeList'),
                            type: 'POST',
                            dataType: 'json',
                        })
                        .done(function(res) {
                            var list = res.data.busTypeList,
                                lis = '';
                            for (var i = 0; i < list.length; i++) {
                                lis += '<div class="mar-b5" data-info=\'' + JSON.stringify(list[i]) + '\'>' + list[i].name + '(可坐' + list[i].passenger_stats + '人) 共需 '
                                + '<input type="text" class="w-60" name="amount" value="' + (i == 0 ? 1 : 0) + '">'
                                + '<span class="T-rideInfo-busPrice"></span></div>'
                            }
                            $layer.find('.T-rideInfo-busList').html(lis).show();
                            $layer.find('.T-rideInfo-contactPrice').text('').hide();
                            getFeiNiuPrice();
                        })
                    break;
                    case '1':
                        $layer.find('.T-rideInfo-busList').html('').hide();
                        $layer.find('.T-rideInfo-contactPrice').show();
                        getFeiNiuPrice();
                    break;
                    default:
                    break;
                }
            });
            function getLocationInfo() {
                if (!$layer.find('[name=hotelInfo]').data('point')) {
                    return;
                }
                var $tripType = $layer.find('[name=feiniuTripType]'),
                    $position = $layer.find('[name=feiniuPosition]'),
                    $hotelInfo = $layer.find('[name=hotelInfo]'),
                    positionLong = $position.find('option:selected').data('longitude'),
                    positionLat = $position.find('option:selected').data('latitude'),
                    hotelInfoLong = $hotelInfo.data('point').lng,
                    hotelInfoLat = $hotelInfo.data('point').lat,
                    tripTypeStart = '';
                if ($tripType.find('option:selected').data('type') === 'starting') {
                    tripTypeStart = true;
                } else if ($tripType.find('option:selected').data('type') === 'destination') {
                    tripTypeStart = false;
                }
                return JSON.stringify({
                    "s_longitude": tripTypeStart ? positionLong : hotelInfoLong,
                    "s_latitude": tripTypeStart ? positionLat : hotelInfoLat,
                    "starting": tripTypeStart ? $position.val() : $hotelInfo.val(),
                    "d_longitude": tripTypeStart ? hotelInfoLong : positionLong,
                    "d_latitude": tripTypeStart ? hotelInfoLat : positionLat,
                    "destination": tripTypeStart ? $hotelInfo.val() : $position.val()
                })
            };

            function getCarJson() {
                var $carList = $layer.find('.T-rideInfo-busList div'),
                    arr = [];
                if ($carList.length) {
                    $carList.each(function(index, el) {
                        var $this = $(el);
                        var json = $this.data('info');
                        json.ferry_car_type_id = json.id;
                        json.amount = $this.find('input').val() || 0;
                        json.unit_price = $this.find('.T-rideInfo-busPrice').data('price');
                        if (json.amount != 0) {
                            arr.push(json);
                        }
                    });
                }
                return JSON.stringify(arr);
            }

            function getFeiNiuPrice() {
                var args = {
                    shuttleIdJson: Tools.getValue($layer, 'shuttleIdJson'),
                    priceType: $layer.find('[name=rideType]:checked').val(),
                    statiion_id: $layer.find('[name=feiniuPosition]').find('option:selected').data('stationid'),
                    use_time: function() {
                        var $useTime = $layer.find('[name=useTime]'),
                            val = $useTime.val() * 1;
                        if ($useTime.find('option:selected').data('target') === 'before') {
                            val = -val;
                        }
                        return Tools.addTime(sendData.shuttleTime, val);
                    },
                    locationInfoJson: getLocationInfo(),
                    carJson: getCarJson()
                }

                if (!args.locationInfoJson
                    || !JSON.parse(args.locationInfoJson).s_longitude
                    || !JSON.parse(args.locationInfoJson).s_latitude
                    || !JSON.parse(args.locationInfoJson).d_longitude
                    || !JSON.parse(args.locationInfoJson).d_latitude
                    || !JSON.parse(args.locationInfoJson).starting
                    || !JSON.parse(args.locationInfoJson).destination
                    ) {
                    return;
                }

                $.ajax({
                    url: Tools.build_url('link/feiniuSystem/order.do','findPriceInfo'),
                    type: 'POST',
                    dataType: 'json',
                    data: args,
                })
                .done(function(res) {
                    var rideType = $layer.find('[name=rideType]:checked').val();
                    if (rideType == '0') {
                        // 包车
                        var priceList = res.data.priceInfo.charter_price_items;
                        for (var i = 0; i < priceList.length; i++) {
                            var id = priceList[i].ferry_car_type_id;
                            $layer.find('.T-rideInfo-busList div').each(function(index, el) {
                                var $this = $(el),
                                    info = $this.data('info');
                                if (id == info.id) {
                                    var price = priceList[i].unit_price / 100;
                                    $this.find('.T-rideInfo-busPrice').text(' ¥ ' + price.toFixed(2) + '/辆').data('price', price.toFixed(2) * 100);
                                }
                            });
                        }
                    } else if (rideType == '1') {
                        // 拼车
                        var price = res.data.priceInfo.unit_price / 100;
                        $layer.find('.T-rideInfo-contactPrice').text('¥ ' + price.toFixed(2) + '/人');
                    }
                });
            };

            $layer.on('change', '[name=amount], [name=feiniuPosition]', function() {
                getFeiNiuPrice();
            });

            $layer.find('.T-sendShuttleOrder').on('click', function() {
                var type = $layer.find('[name=companyId]').data('type');
                var args = {
                    companyId: Tools.getValue($layer, 'companyId'),
                    shuttleIdJson: Tools.getValue($layer, 'shuttleIdJson'),
                    tripTypeId: Tools.getValue($layer, 'tripTypeId'),
                    priceType: $layer.find('[name=priceType]:checked').val(),
                    price: Tools.getValue($layer, 'price'),
                    remark: Tools.getValue($layer, 'remark'),
                }
                if (type === 'feiniu') {
                    args = $.extend(true, args, {
                        statiion_id: $layer.find('[name=feiniuPosition]').find('option:selected').data('stationid'),
                        use_time: function() {
                            var $useTime = $layer.find('[name=useTime]'),
                                val = $useTime.val() * 1;
                            if ($useTime.find('option:selected').data('target') === 'before') {
                                val = -val;
                            }
                            return Tools.addTime(sendData.shuttleTime, val);
                        },
                        priceType: $layer.find('[name=rideType]:checked').val(),
                        locationInfoJson: getLocationInfo(),
                        carJson: getCarJson()
                    });
                    
                }
                $.ajax({
                    url: Tools.build_url('link/busSystem/order.do','sendBusOrder'),
                    type: 'POST',
                    dataType: 'json',
                    data: args,
                })
                .done(function(res) {
                    if (typeof sendData.callback === 'function') {
                        sendData.callback(res);
                    }
                });
            });
        }
    })
};

Services.getVerifyCode = function(fn, linkGovernmentSystemId) {
    var html = '<div class="tab-content">'
        + '请输入验证码：<input type="text" name="verifyCode" style="height: 31px; margin-right: 5px; position: relative;" />'
        + '<img src="" alt="验证码" style="margin-top: -4px; width: 100px; height: 30px;" />'
        + '<button class="btn btn-success btn-sm btn-block T-save mar-t20">确认</button>'
        + '</div>'
    layer.open({
        title: '验证',
        type: 1,
        area: ['800px', '500px'],
        content: html,
        success: function(lay, layIndex) {
            var $layer = $(lay);
            getImgUrl($layer);

            $layer.find('[name=verifyCode]').on('keypress', function(event) {
                if (event.which == 13) {
                    $layer.find('.T-save').trigger('click');
                }
            });
            $layer.find('.T-save').on('click', function() {
                $.ajax({
                    url: Tools.build_url('link/xinnanmenSystem/order.do','login'),
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        verifyCode: $layer.find('[name=verifyCode]').val(),
                        linkGovernmentSystemId: linkGovernmentSystemId
                    }
                })
                .done(function(res) {
                    if (res.codeResult == 'xinanmen_auto_login_fail') {
                        Tools.showMessage(res.message, 1);
                        $layer.find('[name=verifyCode]').val('').focus();
                        getImgUrl($layer);
                    } else {
                        layer.close(layIndex);
                        if (typeof fn === 'function') {
                            fn();
                        }
                    }
                });
            });
        }
    });

    function getImgUrl($layer) {
        $.ajax({
            url: Tools.build_url('link/xinnanmenSystem/order.do','getVerificationCode'),
            type: 'POST',
            dataType: 'json',
            data: {
                linkGovernmentSystemId: linkGovernmentSystemId
            }
        })
        .done(function(res) {
            $layer.find('img').attr('src', res.data.verificationCodeUrl);
        });
    }
}

/**
 * 景区名称覆盖行程标题
 * @param  {[type]} $tab  [description]
 * @param  {[type]} $page [description]
 * @param  {[type]} $this [description]
 * @return {[type]}       [description]
 */
Services.syncScenicTitle = function($tab, $page, $this) {
    $tab.off('click.syncTitle').on('click.syncTitle', '.T-syncTitle', function() {
        syncTitle($(this));
    });
    if (!!$this) {
        syncTitle($this);
    }
    function syncTitle($that) {
        var $trs = $that.closest('div').next().find('tbody tr'),
            scenicArrangeList = [];
        for (var i = 0; i < $trs.length;i++) {
            var $this = $trs.eq(i);
            var json = {
                date: $this.find('[name=orderDate]').val(),
                whichDay: $this.find('[name=whichDay]').val(),
                name: $this.find('.T-scenic').val()
            }
            if (!$this.find('[name=orderDate]').length && !json.whichDay && !$this.hasClass('T-all')) {
                return;
            }
            if (!json.name && !$this.hasClass('T-all')) {
                Tools.showMessage('请补全第' + (i+1) + '行景区安排名称');
                return;
            }
            if (!json.date && !json.whichDay && !$this.hasClass('T-all')) {
                Tools.showMessage('请补全第' + (i+1) + '行景区安排日期');
                return;
            }
            scenicArrangeList.push(json);
        };
        var $itineraryList = $page ? $page.find('.T-orderItinerary tr') : $tab.find('.T-orderItinerary tr');
        $itineraryList.each(function(index, el) {
            var $this = $itineraryList.eq(index), html = '';
            for (var i = 0; i < scenicArrangeList.length; i++) {
                if (!json.whichDay && (scenicArrangeList[i].date == $this.find('[name=itineraryDate]').val())) {
                    html += '【'+ scenicArrangeList[i].name +'】';
                }
                if (json.whichDay && (scenicArrangeList[i].whichDay == $this.find('[name=whichDay]').val())) {
                    html += '【'+ scenicArrangeList[i].name +'】';
                }
                $this.find('[name=title]').val(html);
            }
        });
        Tools.showMessage('已成功覆盖行程标题！', true);
    }
 };

/**
 * 自动填充人数
 * @param  {[type]} $conent [description]
 * @param  {[type]} $obj    [description]
 * @param  {[type]} $page   [description]
 * @return {[type]}         [description]
 */
Services.autocompleteCount = function($conent, $obj, $page) {
    $conent.on('blur', $obj, function() {
        var adultCount = $page.find('.T-basicInfo [name=adultCount]').val(),
            childCount = $page.find('.T-basicInfo [name=childCount]').val();
        var $that = $(this),
            $tr = $that.closest('tr'),
            type = $that.val(),
            $count = $tr.find('[name=count]');
        if (!!type) {
            if (type.indexOf('大人') != -1 || type.indexOf('成人') != -1) {
                if (!$count.val()) {
                    $count.val(adultCount);
                }
            }
            if (type.indexOf('儿童') != -1 || type.indexOf('小孩') != -1) {
                if (!$count.val()) {
                    $count.val(childCount);
                }
            }
        }
    });
};


 /**
 * 提示框
 * @param  {[type]}   message [description]
 * @param  {Function} fn      [description]
 * @param  {[type]}   closeFn [description]
 * @return {[type]}           [description]
 */
function showConfirmDialog(message, fn, closeFn){
    $conDiaMes.removeClass('hide').dialog({
        modal: true,
        title: "<div class='widget-header widget-header-small'><h4 class='smaller'><i class='ace-icon fa fa-info-circle'></i> 消息提示</h4></div>",
        title_html: true,
        draggable:false,
        buttons: [
            {
                text: " 取消 ",
                "class" : "btn btn-xs btn-heightMall",
                click: function() {
                    $( this ).dialog( "close" );
                    if(closeFn){
                        closeFn();
                    }
                }
            },
            {
                text: " 确定 ",
                "class" : "btn btn-primary btn-xs btn-heightMall",
                click: function() {
                    $( this ).dialog( "close" );
                    if(fn){
                        fn();
                    }
                }
            }
        ],
        open:function(event,ui){
            $(this).find("p").html(message);
        }
    });
}

function showLayerMessage(message) {
    layer.msg(message, {time: 2000});
}

function showMessageDialog(message, fn, closeFn){
    $conDiaMes.removeClass('hide').dialog({
        modal: true,
        title: "<div class='widget-header widget-header-small'><h4 class='smaller'><i class='ace-icon fa fa-info-circle'></i> 消息提示</h4></div>",
        title_html: true,
        draggable:false,
        buttons: [
            {
                text: " 确定 ",
                "class" : "btn btn-primary btn-xs btn-heightMall",
                click: function() {
                    $( this ).dialog( "close" );
                    if(fn){
                        fn();
                    }
                }
            }
        ],
        open:function(event,ui){
            $(this).find("p").text(message);
        }
    });
}

//override dialog's title function to allow for HTML titles//
$.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
    _title: function(title) {
        var $title = this.options.title || '&nbsp;';
        if( ("title_html" in this.options) && this.options.title_html == true ) {
            title.html($title);
        } else {
            title.text($title);
        }
    }
}));

function autoIframeHeight(){
    var iframe = document.getElementById('uyan_container');
    if(iframe){
        var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
        if (iframeWin.document.body) {
            iframe.height = iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight;
        }
    }
}

function setIframeHeight() {
    
    autoIframeHeight();

    setTimeout(function(){
        autoIframeHeight();
    },1000);
    
    setTimeout(function(){
        autoIframeHeight();
    },5000);
};

window.resize = function () {
    setIframeHeight();
};