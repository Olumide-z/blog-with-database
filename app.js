//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//require mongoose
const mongoose = require("mongoose");

//connect to the database
mongoose.connect("mongodb+srv://oluData:emrys2baba@cluster0.hbgkx.mongodb.net/oluData?retryWrites=true&w=majority", 
{useNewUrlParser: true, useUnifiedTopology: true});

//schema
const itemSchema = new mongoose.Schema({
  name: String
});

//model
const Item = mongoose.model("Item", itemSchema);

//documents
const item1 = new Item({
  name: "Welcome to your toDoList!"
});

const item2 = new Item({
  name: "Hit the + plus button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

//schema
const listSchema = new mongoose.Schema({
  name: String,
  item: [itemSchema]
})

//model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){

    //for stopping the repeated posting of the items on the website
  if(foundItems.length === 0){
    Item.insertMany(defaultItems, function(err){
      if(err){
      console.log(err)
        }else{
        console.log("All documents saved sucessfully")
       }
      }); 
      
    res.redirect("/");
  } else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }

    
  })
  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
  
    item.save();
  
    res.redirect("/");  
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.item.push(item);
      foundList.save();
      
      res.redirect("/" + listName)
      
    });
  }

  
});

app.post("/delete", function(req, res){
  
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
          console.log(err);
      }else{
          console.log("file sucessfully deleted")
      }
  
      res.redirect("/")
    });

  }else{
      List.findOneAndUpdate({name: listName}, {$pull: {item: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
      });

  }

  

  
})

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName)

  //to avoid creating d same route params over and over
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create new list
        //document
        const list = new List({
          name: customListName,
         item: defaultItems
        });

        list.save(); 

        res.redirect("/"+ customListName);
      }else{
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.item});
      }
    }
      
  });
  
  
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
