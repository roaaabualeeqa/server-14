'use strict';

//import the express framework
const express = require('express');
//import cors
const cors = require('cors');
const server = express();
const recipesData = require('./data.json');
const axios = require('axios');
require('dotenv').config();
const pg = require('pg'); //1. importing the pg 

//server open for all clients requests
server.use(cors());
server.use(express.json());

const PORT = process.env.PORT || 3000;

//2. create obj from Client
const client = new pg.Client(process.env.DATABASE_URL);

//constructor
function Recipe(id, title, time, summary) {
    this.id = id;
    this.title = title;
    this.time = time;
    this.summary = summary;
}

//Routes
server.get('/', homeHandler)
server.get('/test', testHandler)
server.get('/recipes', recipesHandler)
server.get('/newRecipes', newRecipesHandler)
server.get('/favRecipes',getFavRecipesHandler)
server.post('/favRecipes',addFavRecipeHandler)
server.get('/oneRecipe/:id', getFavRecipeHandler); //1.
server.put('/updateFavRecipe/:id',updateFavRecipeHandler); //2.
server.delete('/deleteFavRecipe/:id', deleteFavRecipeHandler);//3.
server.get('*', defaltHandler)

server.use(errorHandler); //use middleware function



// Functions Handlers
function homeHandler(req, res) {
    res.send("Hello from the HOME route");
}

function testHandler(req, res) {
    let str = "Hello from the backend";
    console.log("Hiiiii");
    res.status(200).send(str);
}

function defaltHandler(req, res) {
    res.status(404).send("defualt route");
}

function recipesHandler(req, res) {
    // console.log(recipesData.data);
    let mapResult = recipesData.data.map((item) => {
        let singleRecipe = new Recipe(item.id, item.title, item.readyInMinutes, item.summary);
        return singleRecipe;
    })
    res.send(mapResult);
}

function newRecipesHandler(req, res) {
    try {

        const APIKey = process.env.APIKey;
        console.log(APIKey)
        const url = `https://api.spoonacular.com/recipes/random?apiKey=${APIKey}&number=3`;
        console.log("before axios");
        axios.get(url)
            .then((result) => {
                //code depends on axios result
                console.log("axios result");

                let mapResult = result.data.recipes.map((item) => {
                    let singleRecipe = new Recipe(item.id, item.title, item.readyInMinutes, item.summary);
                    return singleRecipe;
                })
                res.send(mapResult);
            })
            .catch((err) => {
                console.log("sorry", err);
                res.status(500).send(err);
            })

        //code that does not depend on axios result
        console.log("after axios");
    }
    catch (error) {
        errorHandler(error,req,res);
    }
}

function getFavRecipesHandler(req,res) {
    // return all fav recipes (favREcipes tabel content)
    const sql = `SELECT * FROM favRecipes`;
    client.query(sql)
    .then((data)=>{
        res.send(data.rows);
    })
    .catch((err)=>{
        errorHandler(err,req,res);
    })
}

function addFavRecipeHandler(req,res) {
    const recipe = req.body; //by default we cant see the body content
    console.log(recipe);
    const sql = `INSERT INTO favrecipes (title, min, summary) VALUES ($1,$2,$3) RETURNING *;`
    const values = [recipe.title, recipe.min, recipe.summary];
    console.log(sql);

    client.query(sql,values)
    .then((data) => {
        res.send("your data was added !");
    })
        .catch(error => {
            // console.log(error);
            errorHandler(error, req, res);
        });
}


function getFavRecipeHandler(req,res){ //2
    const id = req.params.id;

    const sql = `SELECT * FROM favRecipes WHERE id = ${id}`;

    client.query(sql).then(data => {
        return res.status(200).json(data.rows);
    })
    .catch(error => {
        errorHandler(error, req,res);
    });
};


function updateFavRecipeHandler(req, res){
    const id = req.params.id;
    const recipe = req.body;
    console.log(id);
    console.log(recipe);

    const sql = `UPDATE favRecipes SET title=$1, min=$2, summary=$3 WHERE id=${id} RETURNING *;`;
    const values = [recipe.title, recipe.min, recipe.summary];

    client.query(sql, values).then(data => {
        return res.status(200).json(data.rows);
        // or you can send 204 status with no content
        // return res.status(200).json(data.rows);
    }).catch( err => {
        console.log(err);
        errorHandler(err,req,res);
    });

};


function deleteFavRecipeHandler(req , res){
    const id = req.params.id;

    const sql = `DELETE FROM favRecipes WHERE id=${id};`;
    console.log("the item was deleted !");
    client.query(sql).then(() => {
        res.status(200).send("the item was deleted !"); //204: no content
    })
    .catch(err => {
        errorHandler(err,req,res);
    })
};

//middleware function
function errorHandler(erorr, req, res) {
    const err = {
        status: 500,
        massage: erorr
    }
    res.status(500).send(err);
}
//3. connect the server with demo13 database
// http://localhost:3000 => (Ip = localhost) (port = 3000)
client.connect()
.then(()=>{
    server.listen(PORT, () => {
        console.log(`listening on ${PORT} : I am ready`);
    });  
})


