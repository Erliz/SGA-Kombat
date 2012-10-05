/**
 * Функция для получения ответа в виде алерта
 */
function getAnsw(){
    // получение доступа к внутренним iframe
    var iframe = document.getElementById('frameLearnTask');
    var frameDoc = iframe.contentDocument || iframe.contentWindow.document;
    var iframe2 = frameDoc.getElementById('frameContent');
    var frame2Doc = iframe2.contentDocument || iframe2.contentWindow.document;
    // ищем скрипт который содержит жашифрованную функцию "CheckAnswer"
    var scripts=frame2Doc.getElementsByTagName('script');
    for(var ki=0;ki<scripts.length;ki++){
        var uri=scripts[ki].getAttribute('src');
        if(uri!==null && uri.match(/(check_[0-9a-z-]*\.js)/)){
            // запоминаем токен скрипта
            uri=RegExp.$1;
            break;
        }
    }
    // получаем дополнительные параметры, для построения url к скрипту
    document.URL.toString().match(/([a-zA-Z0-9\.\/:]*)Frameset\.aspx\?View=([0-9]*)&AttemptId=([0-9]*)/);
    // формируем  абсолютный путь
    uri=RegExp.$1+'Content.aspx/'+RegExp.$2+'/'+RegExp.$3+'/scripts/'+uri;
    // делаем ajax запрос за скриптом
    var ajaxq = new XMLHttpRequest();
    ajaxq.open('get', uri);
    // в callback обрабатываем всю логику действия
    ajaxq.onreadystatechange = function (){
        if(ajaxq.readyState == 4){
            var cont = ajaxq.responseText;
            // выполняем скаченный скрипт
            eval(cont);
            // грепаем токены с ответами и их порядок
            var token=CheckAnswer.toString().match(/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/g);
            var alertLog=[];
            // ищем врапер с ответами
            var list = frame2Doc.getElementById('answers') || frame2Doc.getElementById('AnswersTable');
            if(list!=null){
                // ищем тексты ответов
                var answ=list.getElementsByTagName('span') || list.getElementsByTagName('div');
                for(var t=0;t<token.length;t++){
                    for(var l=0;l<answ.length;l++){
                        if(answ[l].getAttribute('answerid')==token[t] || answ[l].getAttribute('id')==token[t]){
                            // формируем выдачу
                            alertLog.push(answ[l].innerHTML);
                        }
                    }
                }
            }else {
                // предупреждение о том, что не нашли блок с ответами
                alert('Warning: no list!');
            }
            // вывод ответов
            alert(alertLog.join('\n\n'));
        }
    };
    ajaxq.send(null);
}
// вызов функции
getAnsw();