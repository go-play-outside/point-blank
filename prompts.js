var prompts = [
	'test prompt #1',
	'test prompt #2',
	'test prompt #3',
	'test prompt #4',
	'test prompt #5',
	'test prompt #6',
	'test prompt #7',
	'test prompt #8'
];

module.exports = {
	getRandom: function(promptsUsed){
		let i = Math.floor(Math.random() * prompts.length);
		let loopBreaker = 0;
		while (promptsUsed.includes(prompts[i]) && loopBreaker < 10){
			i = Math.floor(Math.random() * prompts.length);
			loopBreaker++;
		}
		return(prompts[i]);
	}
}