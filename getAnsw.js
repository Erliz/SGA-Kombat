/**
 * Классдля получения ответа в виде алерта
 */

var Erudit={
    msg:{
        error:{
            wrapper:'Warning: no list!'
        }
    },

    frames:[
        'frameLearnTask',
        'frameContent'
    ],
    regMask:{
        token: /([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g ,
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
            'span',
            'div'
        ],
        inputs:[
            'input'
        ],
        attr:[
            'answerid',
            'id'
        ]
    },

    iframe:undefined,
    url:'',
    ajax:undefined,
    answers:undefined,

    init:function(){
        this.getFrame();
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

    getFrame:function(){
        var iframe = document.getElementById('frameLearnTask');
        var frameDoc = iframe.contentDocument || iframe.contentWindow.document;
        var iframe2 = frameDoc.getElementById('frameContent');
        this.iframe= iframe2.contentDocument || iframe2.contentWindow.document;
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

    getAnswer:function(){
        this.cleanAnswers();
        this.ajax.open('get', this.getUrl());
        this.ajax.send(null);
    },

    parseAnswer:function(text){
        // выполняем скаченный скрипт
        eval(text);
        // грепаем токены с ответами и их порядок
        this.answers.tokens=CheckAnswer.toString().match(this.regMask.token);
        // ищем врапер с ответами
        var list = this.iframe.getElementById('answers') || this.iframe.getElementById('AnswersTable');
        if(list!=null){
            // ищем тексты ответов
            var answ=list.getElementsByTagName('span') || list.getElementsByTagName('div');
            for(var t=0;t<this.answers.tokens.length;t++){
                for(var l=0;l<answ.length;l++){
                    if(answ[l].getAttribute('answerid')==this.answers.tokens[t] || answ[l].getAttribute('id')==this.answers.tokens[t]){
                        // формируем выдачу
                        this.answers.texts.push(answ[l].innerHTML.replace(this.regMask.text, ''));
                    }
                }
            }
        }else {
            // предупреждение о том, что не нашли блок с ответами
            alert(this.msg.error.wrapper);
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
        alert(this.answers.texts.join('\n\n'));
    }
};

Erudit.init();
Erudit.getAnswer();