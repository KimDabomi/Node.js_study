const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const compression = require('compression');
const template = require('./lib/template.js');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
app.get('*', function(req, res, next) {
  fs.readdir('./data', function(error, filelist){
    req.list = filelist;
    next();
  });
})

app.get('/', function(request, response) { 
  const title = 'Welcome';
  const description = 'Hello, Node.js';
  const list = template.list(request.list);
  const html = template.HTML(title, list,
    `
    <h2>${title}</h2>${description}
    <img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px;">
    `,
    `<a href="/topic/create">create</a>`
  ); 

  response.send(html);
});
 
app.get('/topic/create', function(request, response){
  const title = 'WEB - create';
  const list = template.list(request.list);
  const html = template.HTML(title, list, `
    <form action="/topic/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
        <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
        <input type="submit">
      </p>
    </form>
  `, '');

  response.send(html);
});
 
app.post('/topic/create_process', function(request, response){
  const post = request.body;
  const title = post.title;
  const description = post.description;

  fs.writeFile(`data/${title}`, description, 'utf8', function(err){
    response.redirect(`/topic/${title}`);
  });
});
 
app.get('/topic/update/:pageId', function(request, response){
  const filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
    const title = request.params.pageId;
    const list = template.list(request.list);
    const html = template.HTML(title, list,
      `
      <form action="/topic/update_process" method="post">
        <input type="hidden" name="id" value="${title}">
        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
        <p>
          <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
      `,
      `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
    );

    response.send(html);
  });
});
 
app.post('/topic/update_process', function(request, response){
  const post = request.body;
  const id = post.id;
  const title = post.title;
  const description = post.description;

  fs.rename(`data/${id}`, `data/${title}`, function(error){
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
      response.redirect(`/topic/${title}`);
    })
  });
});
 
app.post('/topic/delete_process', function(request, response){
  const post = request.body;
  const id = post.id;
  const filteredId = path.parse(id).base;

  fs.unlink(`data/${filteredId}`, function(error){
    response.redirect('/');
  });
});
 
app.get('/topic/:pageId', function(request, response, next) { 
  const filteredId = path.parse(request.params.pageId).base;

  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
    if(err){
      next(err);
    } else {
      const title = request.params.pageId;
      const sanitizedTitle = sanitizeHtml(title);
      const sanitizedDescription = sanitizeHtml(description, {
        allowedTags:['h1']
      });
      const list = template.list(request.list);
      const html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/topic/create">create</a>
          <a href="/topic/update/${sanitizedTitle}">update</a>
          <form action="/topic/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
      );

      response.send(html);
    }
  });
});

app.use((req, res, next) => {
  res.status(404).send('Sorry cant find that!');
})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Somethig broke!');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})