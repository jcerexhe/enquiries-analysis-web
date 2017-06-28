var express = require('express');
var router = express.Router();

const Language = require('@google-cloud/language');
const textDoc = require('../textDoc');
// const textDoc = require('../sampleText');
const blacklist = require('../blacklist');

/* GET home page. */
router.get('/', function(req, res, next) {

	// Your Google Cloud Platform project ID
	const projectId = process.env.ENQUIRESAPP_GOOGLE_ID;

	// Instantiates a client
	const language = Language({
	  projectId: projectId
	});

	// The text to analyze
	const text = textDoc;

	// Instantiates a Document, representing the provided text
	const document = language.document({ content: text });

	// Detects entities in the document
	document.detectEntities()
	  .then((results) => {
	    const entities = results[1].entities;

	    let items = [];

	    console.log('Entities:');
	    entities.forEach((entity) => {
	      function findEntity(obj) {
	        return obj.name === entity.name;
	      }

	      // return entity if it exists
	      let foundEntity = items.find(findEntity);
	      // if above line is undefined then below with be false
	      if (!!foundEntity) {
	        foundEntity.count = foundEntity.count + 1;
	      } else {
	        let newEntity = new Object();
	        newEntity.name = entity.name;
	        newEntity.count = 1;
	        items.push(newEntity);
	      }
	      
	      // console.log(`${entity.name} - Type: ${entity.type}, Salience: ${entity.salience}`);
	      // if (entity.metadata && entity.metadata.wikipedia_url) {
	      //   console.log(` - Wikipedia URL: ${entity.metadata.wikipedia_url}$`);
	      // }
	    });

	    // remove results in blacklist
	    items = items.filter(function(item){
	      return !blacklist.includes(item.name);
	    })

	    items.sort(function(a, b) {
	      return b.count - a.count;
	    })

	    function formatCSV(entityArray) {
	      let csv = [];
	      // csv format with just comma separated or with new line? How to easily import into excel?
	      entityArray.forEach(entity => csv.push(`${entity.count} - ${entity.name}`));
	      csv.join(', ');
	      return csv;
	    }

	    // working on getting CSV formatting
	    // console.log(formatCSV(items))

	    let smallList = items.slice(0, 100);
	    return smallList;
	  }).then(smallList => {
	  	res.render('index', {
		  	title: 'Enquiries Analytics',
		  	labels: smallList.map(function(el) {return el.name;}),
		  	counts: smallList.map(function(el) {return el.count;})
		  });
	  })
	  .catch((err) => {
	    console.error('ERROR:', err);
	  });
});

module.exports = router;
