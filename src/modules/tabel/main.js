/**
 * tabel 页面展示
 * 
 * 作者： 小蒋
 */
define(function(require, exports, module) {
    var templateHtml = {
            list: require('./view/list'),
            listTable: require('./view/listTable'),
            view: require('./view/view'),
        },
        moduleName = 'sys-tabel',
        baseUri = '/public';

    var SysModule = function() {};

    SysModule.prototype.init = function() {
        // load page
        this.loadPage();
    };

    /**
     * 加载tabel页面
     */
    SysModule.prototype.loadPage = function() {
        Services.addPage(moduleName, '员工管理', templateHtml.list(), this, this.loadPage);
        this.$container = $('#' + moduleName);
        this.getList();

        this.init_event();
    };

    /**
     * 绑定事件
     */
    SysModule.prototype.init_event = function() {
        var that = this;
        var $searchArea = this.$container.find('.search-area');

        Services.bindAutoComplete('department', $searchArea.find('.T-departmentName'));
        
    };    

    /**
     * 获取 abel 列表
     */
    SysModule.prototype.getList = function(page) {
        var that = this,
        args = Tools.getAreaArgs(that.$container.find('.search-area'));

        args.pageNo = page || 0;

        $.ajax({
            url: Tools.build_url(baseUri, 'findList.json'),
            type: 'get',
            dataType: 'json'
        })
        .done(function(res) {   

            that.$container.find('.T-list').html(html);
            that.pageNo = res.data.pageNo;
            laypage({
                cont: that.$container.find('.page-area'),
                pages: res.data.totalPage, //总页数
                curr: (args.pageNo + 1),
                jump: function(obj, first) {
                    if (!first) { // 避免死循环，第一次进入，不调用页面方法
                        that.getList(obj.curr - 1);
                    }
                }
            });
            that.$container.find('.page-area').append('共计 '+res.data.recordSize + ' 条记录');
        });
    };

    // 外调初始化函数
    exports.init = function() {
        (new SysModule()).init();
    };

    
});