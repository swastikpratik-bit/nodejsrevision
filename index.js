import express from "express";
import path from "path";
import mongoose from "mongoose"; 
import cookieParser from "cookie-parser";  
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();



// Mongoose-->
mongoose
    .connect("mongodb+srv://swastiksingh368:IEa1avoK1xQUuvrK@cluster0.k0vd22v.mongodb.net/learning_backend")
    .then(() => console.log("Database Connect"))
    .catch((e) => console.log(e))

const userSchema = new mongoose.Schema({
    name: String,
    email: String, 
    password : String
});

const User = mongoose.model("User", userSchema);



// using middlewares--->
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");



// for authentication-->
const isAuthencated = async(req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.verify(token, "swastik");
        req.user = await User.findById(decoded._id);
        next();
    }
    else {
        res.redirect("/login");
    }
}

app.get("/", isAuthencated, (req, res) => {
    // console.log(req.user);
    res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
    res.render("register",)
});



app.post("/register", async(req, res) => {

    const { name, email , password} = req.body;

    const curUser = await User.findOne({ email });
    if (curUser) {
        return res.redirect("/login");
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    
    const user = await User.create({
        name,
        email,
        password: hashedpassword
    });

    const token = jwt.sign({ _id: user._id }, "swastik");

    res.cookie("token", token, {
        httpOnly: false,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");
})


app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async(req, res) => {
   
    const { email , password } = req.body;
    let user = await User.findOne({email});
    if (!user) {
        return res.redirect("/register");
    }

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) return res.render("login", { email,message: "Incorrect password" });

    const token = jwt.sign({ _id: user._id }, "swastik");

    res.cookie("token", token, {
        httpOnly: false,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");



})


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: false,
        expires: new Date(Date.now())
    })
    res.redirect("/");
})



// port listen -->  
app.listen(5000, () => {
    console.log("Server is running at PORT 5000");
})