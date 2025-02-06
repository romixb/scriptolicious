
**1.** Check that you have node.js available on your machine
**2.** Get your wiremock up and running localy:
```bash
docker run -d -it --rm -p 8080:8080 --name wiremock wiremock/wiremock:2.31.0
```
**3.** Get the script into root directory where your mocks are (mine has a 'mappings' directory so adjust the target directory if needed)

**4.** Get axios installed..
```bash
npm install axios
```
**5.** .. and hit
```bash
node imorter.js
```
