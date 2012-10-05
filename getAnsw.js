function getAnsw(){
    var iframe = document.getElementById('frameLearnTask');
    var frameDoc = iframe.contentDocument || iframe.contentWindow.document;
    var iframe2 = frameDoc.getElementById('frameContent');
    var frame2Doc = iframe2.contentDocument || iframe2.contentWindow.document;

    var scripts=frame2Doc.getElementsByTagName('script');
    for(var ki=0;ki<scripts.length;ki++){
        var uri=scripts[ki].getAttribute('src');
        if(uri!==null && uri.match(/(check_[0-9a-z-]*\.js)/)){
            uri=RegExp.$1;
            break;
        }
    }

    document.URL.toString().match(/([a-zA-Z0-9\.\/:]*)Frameset\.aspx\?View=([0-9]*)&AttemptId=([0-9]*)/);
    uri=RegExp.$1+'Content.aspx/'+RegExp.$2+'/'+RegExp.$3+'/scripts/'+uri;
    var ajaxq = new XMLHttpRequest();
    ajaxq.open('get', uri);
    ajaxq.onreadystatechange = function (){
        if(ajaxq.readyState == 4){
            var cont = ajaxq.responseText;
            eval(cont);
            var token=CheckAnswer.toString().match(/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g);

            console.log(token);
            var alertLog=[];
            var list = frame2Doc.getElementById('answers') || frame2Doc.getElementById('AnswersTable');

            if(list!=null){
                var answ=list.getElementsByTagName('span') || list.getElementsByTagName('div');
                for(var t=0;t<token.length;t++){
                    for(var l=0;l<answ.length;l++){
                        if(answ[l].getAttribute('answerid')==token[t] || answ[l].getAttribute('id')==token[t]){
                            alertLog.push(answ[l].innerHTML);
                        }
                    }
                }
            }else {
                alert('Warning: no list!');
            }
            alert(alertLog.join('\n\n'));
        }
    };
    ajaxq.send(null);
}
getAnsw();