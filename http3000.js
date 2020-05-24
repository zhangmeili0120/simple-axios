const Koa = require("koa");
const Router = require("koa-router");
const static = require("koa-static");
const koabody = require("koa-body");
const app = new Koa();
const router = new Router();

app.use(static(__dirname + '/static'))
app.use(koabody());
router.get('/getAxios', ctx => {
  ctx.body = ctx.query
})

router.post("/postAxios", ctx => {
  console.log(ctx.request.body);
  
  ctx.body = JSON.stringify(ctx.request.body)
})
app.use(router.routes());

app.listen(3000);