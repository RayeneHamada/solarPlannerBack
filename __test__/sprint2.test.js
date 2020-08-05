const app = require('../index');
const supertest = require('supertest')
const request = supertest(app)
let token='';
let area = [
    {lat:-34.4792448627647,lon:149.18752617054028},
    {lat:-34.47779441521294,lon:149.1874403398518},
    {lat:-34.47736988920821,lon:149.18814844303174},
    {lat:-34.477759038128376,lon:149.18907112293286},
    {lat:-34.478838032459244,lon:149.18913549594922}
];
let panel = "5f1306a76f14e746b328f2a4";
let azimuth="";
let tilt;
let panelNumber;
let rawSpacing;
let user;
let projectId;


describe('Tests user stories of the second sprint',() =>{


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
        const response = await request.delete("/user/delete/"+id).send();
        expect(response.status).toBe(200);
        if(response.status == 200)
        {token = response.body.token;}
    },60000)


})