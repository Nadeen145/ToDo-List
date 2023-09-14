import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const uri = "your uri from mongoDB Atlas";
async function connect() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch(error) {
    console.log(error);
  }
}
await connect();

const app = express();
const port = 3000;
const Task = mongoose.model("Task", {
    name : String,
    type: String,
    checked: Boolean, 
    date: String,
});

let date = new Date();
let pageName = getDayName(date.getDay()) 
                + ", " 
                + date.getDate() 
                + "."  
                + (date.getMonth()+1) 
                + "." 
                + date.getFullYear();
function getDayName(num) {
    switch(num) {
        case 0: return "Sun";
        case 1: return "Mon";
        case 2: return "Tues";
        case 3: return "Wed";
        case 4: return "Thurs";
        case 5: return "Fri";
        case 6: return "Sat";

        default: return "Sun";
    }
}

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

app.get("/", async (req, res) => {
    try{
        date = new Date();
        pageName = getDayName(date.getDay()) 
            + ", " 
            + date.getDate() 
            + "."  
            + (date.getMonth()+1) 
            + "." 
            + date.getFullYear();

        await Task.deleteMany({ type: "Today", date: { $ne: pageName } });
        const todoList = await Task.find({ type:"Today", date:pageName }).exec();
        
        res.render("index.ejs", {
            pageName: pageName, 
            todoList: todoList,
        });
    } catch(error) {
        console.log(error);
    }
});

app.get("/other", async (req, res) => {
    try{
        pageName = "Other ToDo";
        const todoList = await Task.find({ type:"Other" }).exec();

        res.render("index.ejs", {
            pageName: pageName, 
            todoList: todoList,
        });
    } catch(error) {
        console.log(error);
    }
});

app.post("/add", async (req, res) => {
    const taskName = req.body["newTask"];    
    const found = await Task.find({ name: taskName });

    if(found.length !== 0) {
        if(pageName == "Other ToDo"){
            if(found[0].type === "Other"){
                res.redirect('/other');
                return;
            }
        } else{
            if(found[0].type === "Today"){
                res.redirect('/');
                return;
            }
        }
    }

    try{
        if(pageName == "Other ToDo"){
            const task = new Task({
                name : taskName,
                type: "Other",
                checked: false,
            });
            await task.save();
            res.redirect('/other');
        } else {
            const task = new Task({
                name : taskName,
                type: "Today",
                checked: false, 
                date: pageName,
            });
            await task.save();
            res.redirect('/');
        }
    } catch(error) {
        console.log(error);
    }
});

app.post("/task", async (req, res) => {
    if(req.body["checkName"] != undefined){
        try{
            const taskName = req.body["checkName"];
            const taskType = pageName === "Other ToDo"? "Other" : "Today";
            const found = await Task.find({ name:taskName, type:taskType }).exec();
            if(found.length === 0) {
                if(pageName == "Other ToDo"){
                    res.redirect('/other');
                } else {
                    res.redirect('/');
                }

                return;
            }

            const checked = !found[0].checked;
            await Task.findOneAndUpdate({ name:taskName, type:taskType }, { checked:checked });
            
            if(pageName === "Other ToDo"){
                res.redirect('/other');
            } else {
                res.redirect('/');
            }
        } catch(error) {
            console.log(error);
        }
    } else if(req.body["removeName"] != undefined){
        try{
            const taskName = req.body["removeName"];
            const taskType = pageName === "Other ToDo"? "Other" : "Today";
            const found = await Task.deleteOne({ name:taskName, type:taskType }).exec();

            if(pageName === "Other ToDo"){
                res.redirect('/other');
            } else {
                res.redirect('/');
            }
        } catch(error) {
            console.log(error);
        }
    } else {
        if(pageName === "Other ToDo"){
            res.redirect('/other');
        } else {
            res.redirect('/');
        }
    }
});
