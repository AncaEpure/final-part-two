const express = require("express");
const app = express();
app.use(express.json());

let morgan = require("morgan");
app.use(morgan("combined"));

let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));

const cors = require("cors");
app.use(cors());

//Copy paste the following endpoint into your project so that your sourcecode will be in the submission certificate
app.get("/sourcecode", (req, res) => {
    res.send(
        require("fs")
        .readFileSync(__filename)
        .toString()
    );
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

let users = new Map();
let passwords = new Map();
let sessions = new Map();
let carts = [];
let items = new Map();
let purchased = [];
let messages = [];
let shipped = new Map();
let reviews = [];
let reviewedItems = [];

let counter = 89;
let genSessionId = () => {
    counter = counter + 1;
    return "sess" + counter;
};

let itemIdentifier = 100;
let genItemId = () => {
    itemIdentifier = itemIdentifier + 1;
    return "itm" + itemIdentifier;
};

//sign-up
app.post("/signup", (req, res) => {
    let parsedBody = JSON.parse(req.body);
    let username = parsedBody.username;
    let password = parsedBody.password;

    if (!parsedBody.password) {
        res.send(
            JSON.stringify({ success: false, reason: "password field missing" })
        );
    }

    if (!parsedBody.username) {
        res.send(
            JSON.stringify({ success: false, reason: "username field missing" })
        );
    }

    if (passwords.has(parsedBody.username)) {
        if (!res.headersSent) {
            res.send(JSON.stringify({ success: false, reason: "Username exists" }));
        }
        return;
    }

    passwords.set(username, password);
    users.set(username);

    if (!res.headersSent) {
        res.send(JSON.stringify({ success: true }));
    }
});

//login
app.post("/login", (req, res) => {
    let parsedBody = JSON.parse(req.body);
    let usr = parsedBody.username;

    if (!parsedBody.password) {
        res.send(
            JSON.stringify({ success: false, reason: "password field missing" })
        );
    }

    if (!parsedBody.username) {
        res.send(
            JSON.stringify({ success: false, reason: "username field missing" })
        );
    }

    if (!passwords.has(usr)) {
        if (!res.headersSent) {
            res.send(
                JSON.stringify({ success: false, reason: "User does not exist" })
            );
        }
        return;
    }

    let actualPassword = parsedBody.password;
    let expectedPassword = passwords.get(usr);

    if (actualPassword === expectedPassword) {
        let sessId = genSessionId();
        sessions.set(sessId, usr);
        res.send(
            JSON.stringify({
                success: true,
                token: sessId
            })
        );
        return;
    }

    if (!res.headersSent) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "Invalid password"
            })
        );
    }
});

//change-password
app.post("/change-password", (req, res) => {
    let parsedBody = JSON.parse(req.body);
    let changeToken = req.headers.token;
    let usr = sessions.get(changeToken);
    let oldPassword = parsedBody.oldPassword;
    let newPassword = parsedBody.newPassword;

    if (!req.headers.token) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }));
        return;
    }

    if (!sessions.has(changeToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    let expectedPassword = passwords.get(usr);

    if (oldPassword === expectedPassword) {
        passwords.set(usr, newPassword);
        res.send(
            JSON.stringify({
                success: true
            })
        );
        return;
    }

    if (!res.headersSent) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "Unable to authenticate"
            })
        );
    }
});

//create-listing
app.post("/create-listing", (req, res) => {
    let parsedBody = JSON.parse(req.body);
    let createToken = req.headers.token;
    let price = parsedBody.price;
    let description = parsedBody.description;
    let userCreating = sessions.get(createToken);

    if (!req.headers.token) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }));
        return;
    }

    if (!sessions.has(createToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    if (!parsedBody.price) {
        res.send(JSON.stringify({ success: false, reason: "price field missing" }));
        return;
    }

    if (!parsedBody.description) {
        res.send(
            JSON.stringify({ success: false, reason: "description field missing" })
        );
        return;
    }

    let itemId = genItemId();
    items.set(itemId, {
        seller: userCreating,
        price: price,
        description: description
    });

    res.send(
        JSON.stringify({
            success: true,
            listingId: itemId
        })
    );
    return;
});

//listing
app.get("/listing", (req, res) => {
    let itemToView = req.query.listingId;

    let listing = items.get(itemToView);
    let itemKeys = Array.from(items.keys());

    console.log(itemToView);
    console.log(items);
    console.log(itemKeys);
    console.log(itemKeys.includes(itemToView));

    if (itemKeys.includes(itemToView)) {
        res.send(
            JSON.stringify({
                success: true,
                listing: {
                    price: listing.price,
                    description: listing.description,
                    itemId: itemToView,
                    sellerUsername: listing.seller
                }
            })
        );
        return;
    }

    if (!itemKeys.includes(itemToView)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid listing id" }));
    }
    return;
});

//modify-listing
app.post("/modify-listing", (req, res) => {
    let modifyToken = req.headers.token;
    let parsedBody = JSON.parse(req.body);
    let item = items.get(parsedBody.itemid);
    let price = parsedBody.price;
    let description = parsedBody.description;

    if (!req.headers.token) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }));
        return;
    }

    if (!sessions.has(modifyToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    if (!parsedBody.itemid) {
        res.send(
            JSON.stringify({ success: false, reason: "itemid field missing" })
        );
        return;
    }

    console.log(item);

    if (parsedBody.description) {
        item.description = description;
        res.send(
            JSON.stringify({
                success: true
            })
        );
    }

    if (parsedBody.price) {
        item.price = price;
        res.send(
            JSON.stringify({
                success: true
            })
        );
    }
});

//add-to-cart
app.post("/add-to-cart", (req, res) => {
    console.log(req.body);
    let addToken = req.headers.token;
    let parsedBody = JSON.parse(req.body);
    let item = parsedBody.itemid;
    let user = sessions.get(addToken);

    if (!sessions.has(addToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    if (!parsedBody.itemid) {
        res.send(
            JSON.stringify({ success: false, reason: "itemid field missing" })
        );
        return;
    }

    if (!items.has(item)) {
        res.send(JSON.stringify({ success: false, reason: "Item not found" }));
        return;
    }

    if (items.has(item)) {
        carts.push({ user: user, item: item });
        res.send(
            JSON.stringify({
                success: true
            })
        );
        return;
    }
});

//cart
app.get("/cart", (req, res) => {
    let cartToken = req.headers.token;
    let user = sessions.get(cartToken);

    if (!sessions.has(cartToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    let userCart = [];
    console.log(userCart);

    for (let i = 0; i < carts.length; i++) {
        if (carts[i].user === user) {
            userCart.push({
                price: items.get(carts[i].item).price,
                description: items.get(carts[i].item).description,
                itemId: carts[i].item,
                sellerUsername: items.get(carts[i].item).seller
            });
        }
    }

    console.log(userCart);
    console.log(carts);
    res.send(
        JSON.stringify({
            success: true,
            cart: userCart
        })
    );
    return;
});

//checkout
app.post("/checkout", (req, res) => {
    let checkoutToken = req.headers.token;
    let user = sessions.get(checkoutToken);

    if (!sessions.has(checkoutToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    let userCart = [];
    console.log(userCart);
    for (let i = 0; i < carts.length; i++) {
        let item = carts[i].item;
        console.log(user);
        if (carts[i].user === user) {
            console.log(item);
            userCart.push(item);
        }
    }

    console.log(userCart);

    if (userCart.length === 0) {
        res.send(JSON.stringify({ success: false, reason: "Empty cart" }));
        return;
    }

    let purchasedItems = purchased.map(({ items }) => items);

    console.log(purchasedItems);

    let myItems = Array.prototype.concat.apply([], purchasedItems);

    let check = false;

    for (let i = 0; i < userCart.length; i++) {
        for (let j = 0; j < myItems.length; j++) {
            if (userCart[i] === myItems[j]) {
                check = true;
            }
        }
    }

    if (check) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "Item in cart no longer available"
            })
        );
        return;
    }

    purchased.push({ user: user, items: userCart });
    console.log(purchased);
    res.send(
        JSON.stringify({
            success: true
        })
    );
    return;
});

//purchase-history
app.get("/purchase-history", (req, res) => {
    let historyToken = req.headers.token;
    let user = sessions.get(historyToken);

    if (!sessions.has(historyToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }
    console.log(user);

    let userPurchase = [];
    console.log(userPurchase);
    for (let i = 0; i < purchased.length; i++) {
        let item = purchased[i].items;
        console.log(user);
        if (purchased[i].user === user) {
            userPurchase.push(item);
        }
    }

    console.log(userPurchase);
    let myItems = userPurchase.flat();

    let toSend = [];

    for (let i = 0; i < myItems.length; i++) {
        toSend.push({
            price: items.get(myItems[i]).price,
            description: items.get(myItems[i]).description,
            itemId: myItems[i],
            sellerUsername: items.get(myItems[i]).seller
        });
    }

    res.send(
        JSON.stringify({
            success: true,
            purchased: toSend
        })
    );
    return;
});

//chat
app.post("/chat", (req, res) => {
    let chatToken = req.headers.token;

    if (!sessions.has(chatToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    let body = req.body;
    let parsedBody = JSON.parse(body);
    console.log(body);
    let userFrom = sessions.get(chatToken);
    let destination = parsedBody.destination;
    let contents = parsedBody.contents;

    console.log(destination);
    console.log(contents);

    if (!destination) {
        res.send(
            JSON.stringify({ success: false, reason: "destination field missing" })
        );
        return;
    }

    if (!contents) {
        res.send(
            JSON.stringify({ success: false, reason: "contents field missing" })
        );
        return;
    }

    if (!passwords.has(destination)) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "Destination user does not exist"
            })
        );

        return;
    }

    messages.push({ from: userFrom, contents: contents, to: destination });

    res.send(
        JSON.stringify({
            success: true
        })
    );
    return;
});

//chat-messages
app.post("/chat-messages", (req, res) => {
    let getMsgToken = req.headers.token;
    let userFrom = sessions.get(getMsgToken);

    if (!sessions.has(getMsgToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    let parsedBody = JSON.parse(req.body);
    let userTo = parsedBody.destination;

    if (!userTo) {
        res.send(
            JSON.stringify({ success: false, reason: "destination field missing" })
        );
        return;
    }

    if (!passwords.has(userTo)) {
        res.send(
            JSON.stringify({ success: false, reason: "Destination user not found" })
        );
        return;
    }

    console.log(messages);

    let userMessages = [];
    console.log(userMessages);

    for (let i = 0; i < messages.length; i++) {
        let msg = messages[i];
        if (
            (messages[i].to === userTo && messages[i].from === userFrom) ||
            (messages[i].to === userFrom && messages[i].from === userTo)
        ) {
            userMessages.push(msg);
        }
    }

    let toSend = [];

    for (let i = 0; i < userMessages.length; i++) {
        toSend.push({
            from: userMessages[i].from,
            contents: userMessages[i].contents
        });
    }
    res.send(
        JSON.stringify({
            success: true,
            messages: toSend
        })
    );
    return;
});

//ship
app.post("/ship", (req, res) => {
    let shipToken = req.headers.token;
    let parsedBody = JSON.parse(req.body);
    let id = parsedBody.itemid;
    let user = sessions.get(shipToken);

    console.log(items);

    console.log(id);
    console.log(purchased);

    let itemsPurchased = [];

    console.log(itemsPurchased);
    for (let i = 0; i < purchased.length; i++) {
        let item = purchased[i].items;
        itemsPurchased.push(item);
    }

    console.log(itemsPurchased);

    let toCheck = itemsPurchased.flat();

    console.log(toCheck);

    if (!toCheck.includes(id)) {
        res.send(JSON.stringify({ success: false, reason: "Item was not sold" }));
        return;
    }

    if (shipped.has(id)) {
        res.send(
            JSON.stringify({ success: false, reason: "Item has already shipped" })
        );
        return;
    }

    if (items.get(id).seller !== user) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "User is not selling that item"
            })
        );
        return;
    }

    shipped.set(id);

    res.send(
        JSON.stringify({
            success: true
        })
    );
    return;
});

//status
app.get("/status", (req, res) => {
    let statusToken = req.headers.token;
    let id = req.query.itemid;

    if (shipped.has(id)) {
        res.send(JSON.stringify({ success: true, status: "shipped" }));
        return;
    }

    let itemsPurchased = [];

    console.log(itemsPurchased);
    for (let i = 0; i < purchased.length; i++) {
        let item = purchased[i].items;
        itemsPurchased.push(item);
    }

    console.log(itemsPurchased);

    let toCheck = itemsPurchased.flat();

    if (!toCheck.includes(id)) {
        res.send(JSON.stringify({ success: false, reason: "Item not sold" }));
        return;
    }
    if (!shipped.has(id)) {
        res.send(JSON.stringify({ success: true, status: "not-shipped" }));
        return;
    }
});

//review-seller
app.post("/review-seller", (req, res) => {
    let reviewToken = req.headers.token;
    let parsedBody = JSON.parse(req.body);
    let stars = parsedBody.numStars;
    let contents = parsedBody.contents;
    let id = parsedBody.itemid;
    let user = sessions.get(reviewToken);

    if (!sessions.has(reviewToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
        return;
    }

    if (reviewedItems.includes(id)) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "This transaction was already reviewed"
            })
        );
        return;
    }

    let userPurchase = [];
    console.log(userPurchase);
    for (let i = 0; i < purchased.length; i++) {
        let item = purchased[i].items;
        console.log(user);
        if (purchased[i].user === user) {
            userPurchase.push(item);
        }
    }

    console.log(userPurchase);
    let myItems = userPurchase.flat();

    if (!myItems.includes(id) || !items.has(id)) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "User has not purchased this item"
            })
        );
        return;
    }

    reviewedItems.push(id);
    reviews.push({ from: user, numStars: stars, contents: contents, itemid: id });

    res.send(
        JSON.stringify({
            success: true
        })
    );
    return;
});

//reviews
app.get("/reviews", (req, res) => {
    let user = req.query.sellerUsername;

    let userReviews = [];

    for (let i = 0; i < reviews.length; i++) {
        if (items.get(reviews[i].itemid).seller === user) {
            userReviews.push({
                from: reviews[i].from,
                numStars: reviews[i].numStars,
                contents: reviews[i].contents
            });
        }
    }
    res.send(
        JSON.stringify({
            success: true,
            reviews: userReviews
        })
    );
    return;
});

//selling
app.get("/selling", (req, res) => {
    let user = req.query.sellerUsername;

    if (!user) {
        res.send(
            JSON.stringify({
                success: false,
                reason: "sellerUsername field missing"
            })
        );
        return;
    }

    let itemsSold = items.entries();
    console.log(itemsSold);
    let toCheck = Array.from(itemsSold);

    console.log(toCheck);
    let selling = [];

    for (let i = 0; i < toCheck.length; i++) {
        if (toCheck[i].seller === user) {
            selling.push(toCheck[i]);
        }
    }

    res.send(JSON.stringify({ success: true, selling: selling }));
    return;
});