const express = require("express");
const routes = require("./app/routes/router");

const app = express();
const port = 3000;

// Middleware para servir archivos estáticos
app.use(express.static("app/public"));

// Usar las rutas definidas en routes/route.js
app.use("/", routes);

app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});
