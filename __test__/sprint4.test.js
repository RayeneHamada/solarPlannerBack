const app = require('../index');
const supertest = require('supertest')
const request = supertest(app)
let token='';



describe('Tests user stories of the third sprint',() =>{


    it("tests client simple login", async () => {
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


    it("tests the user dashboard", async () => {
        const response = await request.get("/dashboard").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);
    },60000)

    it("tests the panel creation", async () => {
        const response = await request.post("/panel/new").set('Authorization','Bearer '+token).send(
            {
                name:'test panel',
                capacity:250,
                height: 200,
                width: 100,
                technology: 'Monocrystalline',

             }
        );
        expect(response.status).toBe(200);
        project = response.body.projectId;

    },60000)

    it("tests admin simple login", async () => {
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

    it("tests if the admin could delete a certain user", async () => {
        const response = await request.del("/user/delete").send(
            {
                id: "5f19ba834b3cad21520a468a",
            }
        );
        expect(response.status).toBe(200);
        if(response.status == 200)
        {token = response.body.token;}
    },60000)


})