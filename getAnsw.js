/**
 * Классдля получения ответа в виде алерта
 */

var Erudit={
    msg:{
        error:{
            wrapper:'Warning: no list!',
            showMethod:'No such output method',
            noAnswer:'No answers find!'
        },
        service:{
            found: 'Question exist. Finding answer...',
            empty: 'No question found'
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
        token: /([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g ,
        string: /String\('([а-яА-Яa-zA-Z0-9- ]*)'\)/,
        domain: /([a-zA-Z0-9\.\/:]*)Frameset\.aspx\?View=([0-9]*)&AttemptId=([0-9]*)/,
        script: /(check_[0-9a-z-]*\.js)/,
        text: /<\/?[^>]+>/gi
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
        current:undefined
    },
    ajax:undefined,
    answers:undefined,
    showMethod:'alert',
    service:{
        intervalId:undefined,
        status:false,
        timeout: 20 // seconds
    },

    init:function(){
        this.initAjax();
    },

    initAjax:function(){
        this.ajax = new XMLHttpRequest();
        // в callback обрабатываем всю логику действия
        this.ajax.onreadystatechange = function(){
            if(Erudit.ajax.readyState == 4){
                Erudit.parseAnswer(Erudit.ajax.responseText);
            }
        }
    },

    setShowMethod:function(method){
        if(typeof method=='undefined') return;
        this.showMethod=method;
    },

    getTframe:function(){
        if(this.cframe) return this.cframe;
        var frame = document.getElementById('frameLearnTask');
        return this.cframe = frame.contentDocument || frame.contentWindow.document;
    },

    getIframe:function(){
        var frame = this.getTframe().getElementById('frameContent');
        this.iframe= frame.contentDocument || frame.contentWindow.document;
    },

    getDomainUrl:function(){
        if(this.url.length>0) return this.url;
        document.URL.toString().match(this.regMask.domain);
        // формируем  абсолютный путь
        return this.url=RegExp.$1+'Content.aspx/'+RegExp.$2+'/'+RegExp.$3+'/scripts/';
    },

    getScriptName:function(){
        var scripts=this.iframe.getElementsByTagName('script');
        for(var ki=0;ki<scripts.length;ki++){
            var uri=scripts[ki].getAttribute('src');
            if(uri!==null && uri.match(/(check_[0-9a-z-]*\.js)/)){
                // запоминаем токен скрипта
                return RegExp.$1;
            }
        }
        return false;
    },

    getUrl:function(){
        return this.getDomainUrl()+this.getScriptName();
    },

    getAnswer:function(method){
        if(typeof method!="undefined")this.setShowMethod(method);
        this.cleanAnswers();
        this.getIframe();
        this.ajax.open('get', this.getUrl());
        this.ajax.send(null);
    },

    checkinAnswer:function(){
        var t=this.answers.tokens;
        if(t.length==0) alert(this.msg.error.noAnswer);
        var l=this.wrapper;
        if(t=='input'){
            var field=this.iframe.getElementById(this.html.inputs[1]);
            this.log('set value: '+this.answers.texts[0] );
            field.value=this.answers.texts[0];
        }
        else{
            var fields=l.getElementsByTagName('input');
            for(var i=0;i<t.length;i++){
                for(var x=0;x<fields.length;x++){
                    if(fields[x].value==t[i])fields[x].checked=true;
                }
            }
        }
    },

    submitAnswer:function(){
        this.checkinAnswer();
        // for slide lecture
        var btn=this.iframe.getElementById(this.html.submit[0]);
        setTimeout(function(){btn.click()},this.getRand()*1000);
    },

    nextAnswer:function(){
        this.checkinAnswer();
        //for test training
        var btn=this.iframe.getElementById(this.html.submit[1]);
        setTimeout(function(){btn.click()},this.getRand()*1000);
    },

    getRand:function(){
        var t=this.time;
        return Math.random() * (t.max - t.min) + t.min;
    },

    parseAnswer:function(text){
        // выполняем скаченный скрипт
        eval(text);
        // грепаем токены с ответами и их порядок
        this.answers.tokens = CheckAnswer.toString().match(this.regMask.token);
        if(this.answers.tokens!=null){
        // ищем врапер с ответами
            var list = this.wrapper = this.iframe.getElementById(this.html.wrappers[0]) || this.iframe.getElementById(this.html.wrappers[1]) || this.iframe;
            if(list!=null){
                // ищем тексты ответов
                var answ=list.getElementsByTagName(this.html.texts[0]) || list.getElementsByTagName(this.html.texts[1]);
                for(var t=0;t<this.answers.tokens.length;t++){
                    for(var l=0;l<answ.length;l++){
                        if(answ[l].getAttribute(this.html.attr[0])==this.answers.tokens[t] || answ[l].getAttribute(this.html.attr[1])==this.answers.tokens[t]){
                            // формируем выдачу
                            this.answers.texts.push(answ[l].innerHTML.replace(this.regMask.text, ''));
                        }
                    }
                }
            }else {
                // предупреждение о том, что не нашли блок с ответами
                alert(this.msg.error.wrapper);
            }
        }
        else {
            CheckAnswer.toString().match(this.regMask.string);
            this.answers.texts.push(RegExp.$1);
            this.answers.tokens='input';
            this.log(this.answers.texts);
        }
        // вывод ответов
        this.showAnswers();
    },

    cleanAnswers:function(){
        this.answers={
            tokens:[],
            texts:[]
        }
    },

    showAnswers:function(){
        var text=this.answers.texts.join('\n\n');
        switch(this.showMethod){
            case 'alert': alert(text);break;
            case 'log': console.log(text);break;
            case 'check': this.checkinAnswer();break;
            case 'submit': this.submitAnswer();break;
            case 'next': this.nextAnswer();break;
            default : alert(this.msg.error.showMethod);
        }
    },

    startService:function(type){
        this.service.status=true;
        var obj=this;
        this.service.intervalId=setInterval(function(){obj.serviceIteration(type)},this.service.timeout*1000);
    },

    serviceIteration:function(type){
        this.getIframe();
        var script=this.getScriptName();
        if(script) {
            this.getAnswer(type);
            this.log(this.msg.service.found);
        }
        else this.log(this.msg.service.empty);
    },

    stopService:function(){
        this.service.status=false;
        clearInterval(this.service.intervalId);
    },

    log:function(msg){
        console.log(new Date()+' '+msg);
    }
};

Erudit.init();
Erudit.startService('next');
