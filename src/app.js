import express from 'express'
import cookieParser from 'cookie-parser' 
import session from 'express-session'
import handlebars from 'express-handlebars'
import __dirname from './utils.js'
import routerProducts from './routes/products.router.js' 
import routerCarts from './routes/carts.router.js'
import routerViews from './routes/views.router.js'
import sessionRouter from './routes/session.routes.js'
import { Server } from "socket.io";
import ProductManager from './DAOs/ProductManagerMongo.class.js'
import MongoStore from 'connect-mongo' 
import mongoose from 'mongoose'  
// import { initializePassport } from './config/passport.config.js'
// import initializePassport from './config/passport.config.js'
// import { initializePassport } from './config/passport.config.js'
// import  initialize  from 'passport'
import passport from 'passport'
import { environment } from './env/environment.js'
// import jwt from 'jsonwebtoken' 
import jwt from 'passport-jwt'  
import dotenv from 'dotenv'
import { Command } from 'commander'

///// ************************
import  { initializePassportJWT } from '../src/config/jwt.passport.js'
import  { initializePassportLocal } from '../src/config/local.passport.js'
///// ************************

//***********************************************

//  COMANDO POR CONSOLA ! 
const program = new Command()
program.option('--mode <mode>', 'modo/entorno de trabajo', 'dev' )
program.parse()

console.log(program.opts());

const mode = program.opts().mode

// dotenv.config()
dotenv.config({
  path: mode == 'dev' ? './.env.development' : './.env.production'
  // SE USA ESTA BARRA \ ??
})
console.log(" CONNECTADO DESDE : ", process.env.USER);
console.log(" process.env.PORT", process.env.PORT);
// app.listen(process.env.PORT)

// ahora si tiro : 
//  node app.js --mode env

//***********************************************

// initial configuration
const app = express(); // inicializo el servidor 
// 
const connection = mongoose.connect(
  // "mongodb+srv://fcurrao1:fcurrao1@cluster0.pzrcxla.mongodb.net/ecommerce?retryWrites=true&w=majority",
  environment.mongoConnection, 
  
  // process.env.MONGO_CONNECTION,
{useNewUrlParser: true, useUnifiedTopology:true}) 

app.use(express.json()); //json
app.use(express.urlencoded({ extended: true }));  // 
app.use(express.static(__dirname + "/public")); // static


// app.use(passport.initialize());
// app.use(passport.initialize)
// app.use(cookieParser("firmaDeLaCookie"))  // cookies  
// initializePassport()

///// ************************
app.use(cookieParser())  
initializePassportJWT()
initializePassportLocal()
app.use(passport.initialize());
///// ************************




app.use(
  session({
    store: new MongoStore({
      mongoUrl: 
      // "mongodb+srv://fcurrao1:fcurrao1@cluster0.pzrcxla.mongodb.net/ecommerce?retryWrites=true&w=majority",
      environment.mongoConnection,
      
  // process.env.MONGO_CONNECTION,
    }),
    secret: "mongoSecret",
    resave: true,
    saveUninitialized: false,
  })
);
  
// app.use(passport.initialize())


// app.get('/user', (req,res)=>{
//   req.session.user = req.query.name 
//   res.send('session set')
// })


// handlebars
app.set("views", __dirname + "/views"); // seteo la carpeta vistas
app.set("view engine", "handlebars"); // seteo la carpeta engine.
app.engine("handlebars", handlebars.engine({
  extname: 'handlebars', 
  runtimeOptions:{allowProtoPropertiesByDefault:true,
  allowedProtoMethodsByDefault:true}
})); 
 

// routers 
app.post('/login2', (req,res)=>{
  const { email, password} = req.body
  if (email=='coder@coder.com' && password=='coderpass'){
    let token = jwt.sign({email,password}, 'coderSecret' , {expriresIn: '24h'} )
    res.cookie('coderCookie',token , {httpOnly:false}).send({status: 'succes'})

  }
   else { 
    res.status(400).send({status : 'error'})
   }
})


app.get('/session', (req, res)=>{
  const name = req.query.name
  if(!req.session.user){
    req.session.user = name
    req.session.contador = 1
    return res.send('bienvenido ' + req.session.user)
  } else{
    req.session.contador++
    return res.send('Es tu visita numero: ' + req.session.contador)
  }
})

app.get('/cookies', (req, res)=>{
  res.render('cookies')
})

app.post('/cookies2', (req, res)=>{
  const data = req.body
  res.cookie(data.name, data.email, {maxAge:10000} , {signed:true} ).send({status: 'succes'})
})

app.get('/cookies2', (req, res)=>{
  console.log("res.cookie", req.cookies) //  cookies2
  res.end()
})


app.use((req,res,next)=>{
  req.socketServer = socketServer
  next()
})

// Mas routers
app.use("/", routerViews); //

app.use("/api/sessions", sessionRouter); //
app.use("/products", routerProducts);
app.use("/carts", routerCarts);

// server start and socket io
const expressServer = app.listen(process.env.PORT, () => console.log("Servidor levantado")) // levanto servidor
const socketServer = new Server(expressServer)  //servidor con socket

socketServer.on("connection", async (socket) => {
  console.log("Estas conectado " + socket.id)

  let productManager = new ProductManager()

  // Se envian todos los productos al conectarse
  socket.emit("update-products", await productManager.getProducts(10, 1,0,null,null))

  // Se agrega el producto y se vuelven a renderizar para todos los sockets conectados
  socket.on("add-product", async (productData) => {
    await productManager.addProduct(productData)
    socketServer.emit("update-products", await productManager.getProducts(10, 1,0,null,null))
  })

  // Se elimina el producto y se vuelven a renderizar para todos los sockets conectados
  socket.on("delete-product", async (productID) => {
    await productManager.deleteProduct(productID)
    socketServer.emit("delete-products", await productManager.getProducts(10, 1,0,null,null))
  }) 
  
    // socketServer.emit('deleteProduct', product.id)


const mensajes = [];
 socket.on("message", (data) => {
    console.log("data,",data)
    mensajes.push({ socketId: socket.id, message: data });
    console.log("mensajes", mensajes)
    socketServer.emit("imprimir", mensajes);
  });
})


