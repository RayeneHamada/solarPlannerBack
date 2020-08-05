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


    it("tests consult my projects list endpoint", async () => {
        const response = await request.get("/").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);
    },60000)

    it("tests the delete project endpoint", async () => {
        const response = await request.post("/project/delete/").set('Authorization','Bearer '+token).send();
        expect(response.status).toBe(200);
        it("tests the optimal project configuration", async () => {
            const response = await request.post("/project/config").set('Authorization','Bearer '+token).send(
                {
                    points:area,
                    panelId: panel
                 }
            );
            expect(response.status).toBe(200);
            if(response.status == 200)
            {
             azimuth = response.body.direction;
             tilt = response.body.tilt;
             rawSpacing = response.body.rawSpacing;
             panelNumber = response.body.panel_number
            }
        },60000)
    
        it("tests the project creation", async () => {
            const response = await request.post("/project/new").set('Authorization','Bearer '+token).send(
                {
                    projectName:'test',
                    points:area,
                    panelId: panel,
                    direction: azimuth,
                    tilt: tilt,
                    panelNumber: panelNumber,
                    rawSpacing: rawSpacing
    
                 }
            );
            expect(response.status).toBe(200);
            project = response.body.projectId;
    
        },60000)

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