/**
 * Классдля получения ответа в виде алерта
 */

var Erudit = {
    msg:{
        error:{
            wrapper:'Warning: no list!',
            showMethod:'No such output method',
            noAnswer:'No answers find!',
            empty: 'Empty script'
        },
        service:{
            found:'Question exist. Finding answer...',
            empty:'No question found'
        }
    },
    time:{
        max:6,
        min:3
    },
    frames:[
        'frameLearnTask',
        'frameContent'
    ],
    regMask:{
        token:/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g,
        string:/String\('([а-яА-Яa-zA-Z0-9- ]*)'\)/,
        domain:/([a-zA-Z0-9\.\/:]*)Frameset\.aspx\?View=([0-9]*)&AttemptId=([0-9]*)/,
        script:/(check_[0-9a-z-]*\.js)/,
        text:/<\/?[^>]+>/gi,
        check:/(check_[0-9a-z-]*\.js)/,
        //node:/(node_[0-9a-z-]+\.htm\?mode=trening)/
        node:/(node_[0-9a-z-]+\.htm)/
    },
    html:{
        wrappers:[
            'answers',
            'AnswersTable'
        ],
        texts:[
            'div',
            'span'
        ],
        inputs:[
            'input',
            'answer'
        ],
        attr:[
            'answerid',
            'id'
        ],
        submit:[
            'btAnswer',
            'btNext'
        ]
    },

    cframe:undefined,
    iframe:undefined,
    wrapper:undefined,
    url:'',
    node:{
        prev:undefined,
        current:undefined,
        url:undefined
    },
    ajax:undefined,
    answers:undefined,
    dictionary:undefined,
    showMethod:'alert',
    service:{
        intervalId:undefined,
        timeout:20 // seconds
    },
    testType:undefined,

    init:function () {
        this.initAjax();
    },

    initAjax:function () {
        this.ajax = new XMLHttpRequest();
        // в callback обрабатываем всю логику действия
        this.ajax.onreadystatechange = function () {
            if (Erudit.ajax.readyState == 4) {
                var answer=Erudit.ajax.responseText;
                if(answer=='Bad Request') Erudit.log('Ajax: '+answer);
                if(Erudit.testType=='module_test') Erudit.getDefinitions(answer);
                else Erudit.parseAnswer(answer);
            }
        }
    },

    setShowMethod:function (method) {
        if (typeof method == 'undefined') return;
        this.showMethod = method;
    },

    getTframe:function () {
        if (this.cframe) return this.cframe;
        var frame = document.getElementById('frameLearnTask');
        return this.cframe = frame.contentDocument || frame.contentWindow.document;
    },

    getIframe:function () {
        var frame = this.getTframe().getElementById('frameContent');
        this.iframe = frame.contentDocument || frame.contentWindow.document;
    },

    getHiddenFrame:function(){
        var frame = this.getTframe().getElementById('frameHidden');
        frame = frame.contentDocument || frame.contentWindow.document;
        return frame;
    },

    getDomainUrl:function () {
        if (this.url.length > 0) return this.url;
        document.URL.toString().match(this.regMask.domain);
        // формируем  абсолютный путь
        return this.url = RegExp.$1 + 'Content.aspx/' + RegExp.$2 + '/' + RegExp.$3 + '/';
    },

    getScriptName:function (regString) {
        var scripts = this.iframe.getElementsByTagName('script');
        for (var ki = 0; ki < scripts.length; ki++) {
            var uri = scripts[ki].getAttribute('src');
            if (uri !== null && uri.match(regString)) {
                // запоминаем токен скрипта
                return RegExp.$1;
            }
        }
        return false;
    },

    getCheckUrl:function(){
        var script= this.getScriptName(this.regMask.check);
        if(!script) return false;
        return this.getDomainUrl() + 'scripts/' +script;
    },

    getNodeUrl:function(){
        if(this.node.url) return this.node.url;
        var url=this.getDomainUrl() + this.getHiddenFrame().getElementById('hidContentHref').value;
        url.match(this.regMask.node);
        this.node.url=this.getDomainUrl()+RegExp.$1;
        return this.node.url;
    },

    getAnswer:function (method) {
        if (typeof method != "undefined")this.setShowMethod(method);
        this.cleanAnswers();
        this.getIframe();
        if(this.getType()=='module_test' && this.dictionary){
            this.findDefinition();
        }
        else{
            this.ajax.open('get', this.getCheckUrl() || this.getNodeUrl());
            this.ajax.send(null);
        }
    },

    getType:function(){
        if(this.testType) return this.testType;
        var title=this.getHiddenFrame().getElementById('hidTitle');
        if(title) title=title.value;
        else {
            var frame = document.getElementById('frameTitle');
            frame = frame.contentDocument || frame.contentWindow.document;
            title=frame.getElementById('txtTitle').innerHTML;
        }
        if(title.search('ГЛОССАРНЫЙ ТРЕНИНГ')!==false) this.testType='module_test';
        else this.testType='default';
        return this.testType;
    },

    checkinAnswer:function () {
        var t = this.answers.tokens;
        if (t.length == 0) alert(this.msg.error.noAnswer);
        var l = this.wrapper;
        if (t == 'input') {
            var field = this.iframe.getElementById(this.html.inputs[1]);
            this.log('set value: ' + this.answers.texts[0]);
            field.value = this.answers.texts[0];
        }
        else {
            var fields = l.getElementsByTagName('input');
            if(fields.length>0){
                for (var i = 0; i < t.length; i++) {
                    for (var x = 0; x < fields.length; x++) {
                        if (fields[x].value == t[i])fields[x].checked = true;
                    }
                }
            }
            else {
                if(this.service.status) this.stopService();
                alert('Charts question detected');
                this.log("\n"+this.answers.texts.join("\n"));
                return false;
            }
        }
        return true;
    },

    submitAnswer:function () {
        this.checkinAnswer();
        // for slide lecture
        var btn = this.iframe.getElementById(this.html.submit[0]);
        setTimeout(function () {
            btn.click()
        }, this.getRand() * 1000);
    },

    nextAnswer:function () {
        //for test training
        if(this.checkinAnswer()){
            var btn = this.iframe.getElementById(this.html.submit[1]);
            setTimeout(function () {
                btn.click()
            }, this.getRand() * 1000);
        }
    },

    getRand:function () {
        var t = this.time;
        return Math.random() * (t.max - t.min) + t.min;
    },

    parseAnswer:function (text) {
        // выполняем скаченный скрипт
        eval(text);
        // грепаем токены с ответами и их порядок
        this.answers.tokens = CheckAnswer.toString().match(this.regMask.token);
        if (this.answers.tokens != null) {
            // ищем врапер с ответами
            var list = this.wrapper = this.iframe.getElementById(this.html.wrappers[0]) || this.iframe.getElementById(this.html.wrappers[1]) || this.iframe;
            if (list != null) {
                // ищем тексты ответов
                var answ = list.getElementsByTagName(this.html.texts[0]) || list.getElementsByTagName(this.html.texts[1]);
                for (var t = 0; t < this.answers.tokens.length; t++) {
                    for (var l = 0; l < answ.length; l++) {
                        if (answ[l].getAttribute(this.html.attr[0]) == this.answers.tokens[t] || answ[l].getAttribute(this.html.attr[1]) == this.answers.tokens[t]) {
                            // формируем выдачу
                            this.answers.texts.push(answ[l].innerHTML.replace(this.regMask.text, ''));
                        }
                    }
                }
            } else {
                // предупреждение о том, что не нашли блок с ответами
                alert(this.msg.error.wrapper);
            }
        }
        else {
            CheckAnswer.toString().match(this.regMask.string);
            this.answers.texts.push(RegExp.$1);
            this.answers.tokens = 'input';
            this.log(this.answers.texts);
        }
        // вывод ответов
        this.showAnswers();
    },

    findDefinition:function(){
        this.wrapper=this.iframe.getElementById('divContent') || this.iframe;
        if(this.wrapper){
            //var list=this.wrapper.innerHTML.match(/<TD class=staticcell>(.*?)<\/TD>/g);
            var list=this.wrapper.getElementsByTagName('div');
            for (var t = 0; t < list.length; t++) {
                //list[t].match(/<TD class=staticcell>(.*?)<\/TD>/);
                var token=list[t].getAttribute('id');
                var answ;
                if(this.dictionary[token]){
                    answ=this.dictionary[token].word+' - '+this.dictionary[token].desc.substr(0,30)+'...';
                }
                else{
                    answ=list[t].innerHTML.substr(0,20)+'...';
                }
                this.log(answ);
            }
        }
        else this.log(this.msg.error.wrapper);
    },

    getDefinitions:function(text){
        if(!text) this.log(this.error.empty);
        var dictionary={};
        var i;
        // todo: не ловит описания со скобками и разные тире.
        var words=text.match(/AddConcept\((.*?)\)/g);
        for(i=0;i<=words.length;i++){
            if(!words[i]) continue;
            words[i].match(/AddConcept\('(.*?)', '([0-9a-z-]*)'\)/);
            dictionary[RegExp.$2]={'word':RegExp.$1,'desc':''};
        }
        var descriptions=text.match(/AddDefinition\(([а-яА-Яa-zA-Z0-9 -«»',\(\)]*)\)/g);
        for(i=0;i<=descriptions.length;i++){
            if(!descriptions[i]) continue;
            descriptions[i].match(/AddDefinition\('([а-яА-Яa-zA-Z0-9 -«»,;\.\(\)]+)', '([0-9a-z-]*)'\)/);
            if(dictionary[RegExp.$2])dictionary[RegExp.$2]['desc']=RegExp.$1;
        }
        this.dictionary=dictionary;
        this.findDefinition();
    },

    cleanAnswers:function () {
        this.answers = {
            tokens:[],
            texts:[]
        }
    },

    showAnswers:function () {
        var text = this.answers.texts.join('\n\n');
        switch (this.showMethod) {
            case 'alert':
                alert(text);
                break;
            case 'log':
                this.log(text);
                break;
            case 'check':
                this.checkinAnswer();
                break;
            case 'submit':
                this.submitAnswer();
                break;
            case 'next':
                this.nextAnswer();
                break;
            default :
                alert(this.msg.error.showMethod);
        }
    },

    startService:function (type) {
        this.service.status = true;
        var obj = this;
        this.service.intervalId = setInterval(function () {
            obj.serviceIteration(type)
        }, this.service.timeout * 1000);
    },

    serviceIteration:function (type) {
        this.getIframe();
        var script = this.getScriptName();
        if (script) {
            this.getAnswer(type);
            this.log(this.msg.service.found);
        }
        else this.log(this.msg.service.empty);
    },

    stopService:function () {
        this.service.status = false;
        clearInterval(this.service.intervalId);
    },

    log:function (msg) {
        console.log(new Date() + ' ' + msg);
    }
};

Erudit.init();

Erudit.getAnswer('console');
//Erudit.startService('next');
