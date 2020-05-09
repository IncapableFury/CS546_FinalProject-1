const express = require("express");
const router = express.Router();
const data = require("../data");
const bcrypt = require("bcrypt");
const url = require('url');
const usersData = data.users;
const productsData = data.products

ObjectId = require('mongodb').ObjectID;


const main = async () => {
    let allUsers = await usersData.getAllUsers()
    for (let j = 0; j < allUsers.length; j++) {
        let albums = allUsers[j].albums
        let detailedAlbums = Array()
        for (let i = 0; i < albums.length; i++) {
            let detailedAlbum = await albumsData.getAlbumById(ObjectId(albums[i]))
            detailedAlbums.push(detailedAlbum)
            // console.log(detailedAlbums)
        }
        allUsers[j].albums = detailedAlbums
    }
    console.log(JSON.stringify(allUsers, null, 1))
}
// main().catch(async (error) => {
//     console.log(error);
// });

router.get("/", async (req, res) => {
    try {
        console.log("Getting all users")
        const allUsers = await usersData.getAllUsers()
        res.status(200).json(allUsers);
    } catch (e) {
        res.status(404).json({ message: "Users not found" });
    }
});

// router.get("/:id", async (req, res) => {
//     let user
//     try {
//         console.log('Getting user with ID:', req.params.id)
//         user = await usersData.getUserById(ObjectId(req.params.id))
//     } catch (e) {
//         console.log("Failed finding user with Id:", req.params.id)
//         res.status(404).json({ message: "User not found" })
//         return
//     }
//     try {
//         res.status(200).json(user)
//     } catch (e) {
//         res.status(400).json({ error: "Failed getting info." });
//     }
// });

router.get("/login", async (req, res) => {
    res.locals.metaTags = {
        title: "login page"
    }
    res.render("pages/login", {
    })
});
router.get("/signup", async (req, res) => {
    res.locals.metaTags = {
        title: "sign up page"
    }
    res.render("pages/signup", {
    })
});
//TODO:check if user already logged in: not possible
router.post("/login", async (req, res) => {
    let username = req.body['username']
    let psw = req.body['psw']
    console.log(`user "${username}" is trying to log in with psw: ${psw}`)
    let user
    try {
        user = await usersData.getUserByName(username)
    } catch (e) {
        console.log(e)
        res.status(400).render("pages/login", { errormessage: "User name and password doesn't match" })
        return
    }
    const hashedPassword = user.password
    const pswmatch = await bcrypt.compare(psw, hashedPassword)
    if (pswmatch) {
        console.log(`user ${username} logged in`)
        req.session.userInfo = username
        // req.session.isAuthenticated = true
        req.session.userId = user._id
        res.redirect("/mainpage")
        // res.redirect(url.format({
        //     pathname: "/mainpage",
        //     userInfo: username,
        // }))
        // res.status(200).render("pages/mainpage", { userInfo: username, isAuthenticated :true })
    } else {
        res.status(400).render("pages/login", { errormessage: "Wrong password" })
    }

});
router.post("/signup", async (req, res) => {
    let username = req.body['username']
    let birthdate = req.body['birthdate']
    let email = req.body['email']

    let psw = req.body['psw']
    // let psw_repeat = req.body['psw-repeat']
    // if (psw != psw_repeat) {
    //     res.status(400).render("pages/signup", { errormessage: "Password doesn't match" })
    //     return
    // }
    const basicInfo = {
        username: username,
        birthdate: birthdate,
    }
    console.log(`user "${email}" is trying to sign up`)
    let new_user
    try {
        new_user = await usersData.addUser(basicInfo, email, psw)
    } catch (e) {
        console.log(e)
        // res.status(400).render("pages/signup", { errormessage: e })
        res.status(400).send({ errormessage: e })//"pages/signup", 
        return
    }
    console.log(`Registration successed.`)
    req.session.userInfo = username
    req.session.userId = user._id
    // res.status(200).render("pages/mainpage")
    res.send({ redirectURL: "/users/login" })
});
//TODO:update user info
router.put("/:id", async (req, res) => {
    let user
    try {
        console.log('Getting user with ID:', req.params.id)
        user = await usersData.getUserById(ObjectId(req.params.id))

    } catch (e) {
        console.log("Failed finding user with Id:", req.params.id)
        res.status(404).json({ message: "User not found" })
        return
    }
    try {
        console.log('Updating user with ID:', req.params.id)
        const data = req.body;
        band = await usersData.updateUser(ObjectId(req.params.id), data.basicInfo, data.email, data.address)
        res.status(200).json(band)
    } catch (e) {
        console.log("Failed updating user with Id:", req.params.id)
        res.status(400).json({ message: "Update failed. JSON provided does not match schema?" });
    }
});
//TODO:not used
router.delete("/:id", async (req, res) => {
    let removedUser
    try {
        removedUser = await usersData.removeUser(req.params.id)
    } catch (e) {
        res.status(404).json({ error: "Can not find user with that id." })
        return
    }
    try {
        console.log('Removing user with ID:', req.params.id)
        res.status(200).json({
            deleted: true,
            data: removedUser
        })
    } catch (e) {
        res.status(400).json({ message: "Can not remove user with that Id" })
    }
});
//TODO:not used
router.post("/", async (req, res) => {
    try {
        const data = req.body;
        console.log(data)
        const newUser = await usersData.addUser(data.basicInfo, data.email, data.address, data.password)
        res.status(200).json(newUser)
    } catch (e) {
        res.status(400).json({ message: "JSON provided does not match schema." })
    }
});
router.get("/logout", async (req, res) => {
    req.session.destroy()
    res.clearCookie("userInfo")
    res.redirect("/mainpage")
})

router.get("/account", async (req, res) => {
    console.log("user", req.session.userInfo, "is accessing account page.")
    console.log(req.session.userId)
    let userId = req.session.userId
    if (!userId | typeof (userId) === "undefined") {
        res.redirect("/mainpage")
    }
    let user
    try {
        user = await usersData.getUserById(userId)
    } catch{
        return
    }
    delete user._id;
    res.status(200).render("pages/account", { userDetails: user})
})

router.get("/shoppingcart", async (req, res) => {
    console.log("user", req.session.userInfo, "is accessing shopping cart.")
    console.log(req.session.userId)
    let userId = req.session.userId
    if (!userId | typeof (userId) === "undefined") {
        res.redirect("/mainpage")
    }
    let userShoppingCartIds
    try {
        userShoppingCartIds = await usersData.getUserCart(userId)
    } catch{
        return
    }
    let userShoppingCart = []
    let cartTotalValue = 0
    for (let id of userShoppingCartIds) {
        let item = await productsData.getProductById(id)
        userShoppingCart.push(item)
        cartTotalValue += item.price
    }
    res.status(200).render("pages/shoppingCart", { cartList: userShoppingCart, cartTotalValue: cartTotalValue })
})

router.get("/checkout", async (req, res) => {
    console.log("user", req.session.userInfo, "is checking out.")
    let userId = req.session.userId
    if (!userId | typeof (userId) === "undefined") {
        res.redirect("/mainpage")
    }
    let user
    try {
        user = await usersData.getUserById(userId)
    } catch{
        return
    }
    let userShoppingCartIds = user.shoppingCart
    // if (typeof userShoppingCartIds == 'undefined' | userShoppingCartIds.length == 0) {
    //     console.log("error occurred when checking out.")
    //     // res.status(400).json({ errormessage: "Your cart is empty" })
    //     return
    // }
    let userShoppingCart = []
    let cartTotalValue = 0
    for (let id of userShoppingCartIds) {
        let item = await productsData.getProductById(id)
        userShoppingCart.push(item)
        cartTotalValue += item.price
    }
    delete user._id
    console.log(user)
    res.status(200).render("pages/checkout", { userAddress: user.address,cartList: userShoppingCart, cartTotalValue: cartTotalValue })
})

module.exports = router;
