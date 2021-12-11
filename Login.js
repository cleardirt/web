var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');     //引入mysql模块
var url = require('url');                      //引入url
var bcrypt = require('bcryptjs')
var app = express();
var find=0;
// 创建 application/x-www-form-urlencoded 编码解析
// var urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(bodyParser.urlencoded({extended: true}))
app.use('/public', express.static('public'));

var mysql_user = {                 //编写数据库链接数据
    host: 'localhost',         //地址
    user: 'root',              //用户名
    password: '123456',              //密码
    database: 'my_sql'         //要链接的数据库名字    就是开始创建的那个表的名字
};

var connection = mysql.createConnection(mysql_user);    //建立数据库链接
connection.connect(function(err) {                     //链接数据库
    if (err) {      //链接错误执行
        console.log('[错误]' + err);
        connection.end();
        return;
    }
    console.log('链接成功');    //否则链接成功
});

app.get('/index.html', function (req, res) {
    res.sendFile( __dirname + "/" + "index.html" );
})
app.get('/LogIn.html', function (req, res) {
    res.sendFile( __dirname + "/" + "LogIn.html" );
})
app.get('/signUp.html', function (req, res) {
    res.sendFile( __dirname + "/" + "signUp.html" );
})
// app.get('/index.html', function (req, res) {
//     res.sendFile( __dirname + "/" + "index.html" );
// })
var Event = require('events').EventEmitter;    //引入事件模块
var query = new Event();                       //创建事件对象



app.post('/process_post', function (req, res) {
    // 输出 JSON 格式
    var response = {
        "first_name":req.body.userName,
        "last_name":req.body.pwd
    };
    // console.log(req.body)
    console.log(response);
    query.emit('login', req.body.userName, req.body.pwd, connection,res);
//绑定login事件  传入 username password  链接数据库对象

})
app.post('/signUp_process_post', function (req, res) {
    // 输出 JSON 格式

    var response = {
        "first_name":req.body.userName,
        "last_name":req.body.pwd
    };
    // console.log(req.body)
    console.log(response);
    query.emit('signup', req.body.userName, req.body.pwd, connection,res);
    // console.log(res.code)
    // res.end(JSON.stringify(response));
})
//定义注册事件    传入 username password  链接数据库对象
query.on('signup', function(username, password, connection,res) {
//编写查询语句
    var find = 'SELECT * FROM userinfo WHERE UserName = "'+username+'"';
//编写添加语句
    var insert = 'INSERT INTO userinfo (Id,UserName,UserPass,Salt) VALUES (0,?,?,?)';
    connection.query(find, function(err, result) {
        if (err) {   //链接失败 直接return;
            console.log('[错误]' + err);
            return;
        }
        if (result.length) {   //如果数据库返回数据 说明账号已存在
            console.log('账号已存在');
            res.json({code: 2, message: '账号已存在'});
        } else {               //否则不存在   可以进行注册
            // 随机字符串
            var salt = bcrypt.genSaltSync(10)
    // 对明文加密
            password=bcrypt.hashSync(password, salt)
            var inserInfo = [username, password,salt];  //定义插入数据
            //执行插入数据语句
            connection.query(insert, inserInfo, function(err, result) {
                if (err) {   //链接失败 直接return;
                    console.log('[注册错误]' + err);
                    return;
                };
                console.log('------------start----------------');
                console.log('注册成功');
                console.log(result);
                console.log('--------------end-----------------');
                res.json({code: 3, message: '注册成功'});
            });
        }
    });
})

query.on('login', function(username, password, connection,res) {
    var s='SELECT * FROM userinfo WHERE UserName = "'+username+'"';
    connection.query(s,function(err, result) {
            if (err) {   //链接失败 直接return;
                console.log('[错误]' + err);
                return;
            }
            if (result.length) {   //如果查到了数据
                console.log('------------start----------------');
                var string = JSON.stringify(result);
                var json = JSON.parse(string)[0];
                console.log(string)
                var salt = json.Salt
// 对明文加密
                var pwd1 = bcrypt.hashSync(password, salt)
                console.log(pwd1)
                console.log(json.UserPass)
                if (json.UserPass===pwd1) {
                    find=1;
                    console.log('密码校验正确');
                } else {
                    find=0;
                    console.log('密码校验错误');
                }
                console.log('--------------end-----------------');
            } else {
                find=0;
                console.log(username+'账号不存在')
            }
            if (find===1) {
                res.json({code: 0, message: '登录成功'});
            }
            else{
                res.json({code: 1, message: '登录失败'});
            }
        }
    )
})
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

