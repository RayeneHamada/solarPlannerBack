const app = require('../index');
const supertest = require('supertest')
const request = supertest(app)
let token='';
let user;


describe('Tests the client features of the user module',() =>{

    it("tests the client registration endpoint", async () => {
        const response = await request.post("/user/register").send(
            {
                fullName: "test",
                email: "test@gmail.com",
                password: "password"
            }
        );
        expect(response.status).toBe(200);
    },60000)

    it("tests client simple login endpoint", async () => {
        const response = await request.post("/user/auth").send(
            {
                email: "test@gmail.com",
                password: "password"
            }
        );
        expect(response.status).toBe(200);
        if(response.status == 200)
        {token = response.body.token;}
    },60000)

    

    it("tests the client change password endpoint", async () => {
        const response = await request.put("/user/updatePassword").set('Authorization','Bearer '+token).send(
            {
                oldPassword: "password",
                newPassword: "password"
            }
        );
        expect(response.status).toBe(200);
    },60000)


})


describe('Tests the client features of the user module',() =>{


    it("tests admin simple login endpoint", async () => {
        const response = await request.post("/user/auth").send(
            {
                email: "admin@admin.com",
                password: "blabla"
            }
        );
        expect(response.status).toBe(200);
        if(response.status == 200)
        {token = response.body.token;}
    },60000)

    

    it("tests the admin change password endpoint", async () => {
        const response = await request.put("/user/updatePassword").set('Authorization','Bearer '+token).send(
            {
                oldPassword: "blabla",
                newPassword: "blabla"
            }
        );
        expect(response.status).toBe(200);
    },60000)

    it("tests the admin consult users list endpoint", async () => {
        const response = await request.get("/user/usersList").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);
    },60000)



})