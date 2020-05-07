const express = require("express");
const router = express.Router();
const data = require("../data");
const prodData = data.products;
const users = data.users


router.get("/:id", async (req, res) => {
  let prodDetails
  try {
    prodDetails = await prodData.getProductById(req.params.id);
  } catch (e) {
    res.redirect("/mainpage");
    return
  }
  res.status(200).render("pages/singleProduct", { prodDetails: prodDetails });

});
//add item to user's cart
router.post("/addCart", async (req, res) => {
  let user
  let userId = req.session.userId
  console.log("geting", req.body,userId)
  try {
    user = await users.getUserById(userId)
  } catch (e) {
    res.status(400).send({ errormessage: "please log in." })//"pages/signup", 
    return
  }
  let userCart = user.shoppingCart
  userCart.push(req.body.ProductToCart)
  try {
    users.patchUser(user._id, { "shoppingCart": userCart })
  } catch{
    throw `unable to add item.`
  }
  console.log("Item has been added into user", user.basicInfo.username, "'s cart")
  console.log(await users.getUserById(userId))
  res.sendStatus(200);
})
module.exports = router;