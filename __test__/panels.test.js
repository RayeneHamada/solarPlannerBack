const app = require('../index');
const supertest = require('supertest')
const request = supertest(app)
let token='';
let panel;


describe('Tests user stories of the panel module',() =>{


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


    it("tests personal panel creation", async () => {
        const response = await request.post("/panel/new").set('Authorization','Bearer '+token).send(
            {
                name:'test personal panel',
                capacity:250,
                height: 200,
                width: 100,
                technology: 'Monocrystalline',
                type: 'personal'

             }
        );
        expect(response.status).toBe(200);
        expect(response.body.type).toBe('personal')
        panel = response.body._id;

    },60000)

    it("tests the consult my panels endpoint", async () => {
        const response = await request.get("/panel/myPanels").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);

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


    it("tests global panel creation", async () => {
        const response = await request.post("/panel/new").set('Authorization','Bearer '+token).send(
            {
                name:'test global panel',
                capacity:250,
                height: 200,
                width: 100,
                technology: 'Monocrystalline',

             }
        );
        expect(response.status).toBe(200);
        expect(response.body.type).toBe('global')
        panel = response.body._id;

    },60000)

    it("tests the consult all panels endpoint", async () => {
        const response = await request.get("/panel/globals").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);

    },60000)


    







})