var prompts = [
	"What keeps you up at night?",
	"The worst topic for an all-hands meeting",
	"I miss ___, Tails. I miss (it/them) a lot.",
	"Get out of my room, Mom, I’m just ___!",
	"The easiest way to make a gamer mad",
	"The worst thing to say during your Supreme Court Justice confirmation hearing",
	"___? That’s a weird name for ___.",
	"You’ve heard of Cat in the Hat, but have you heard of ___?",
	"Everyone gangsta until ___",
	"The last thing you want on your ___ is ___. But as it turns out, that may be what you get.",
	"The worst custom license plate",
	"The fastest way to get banned from a chat server",
	"Your superhero catchphrase",
	"What does Obama do on weekends?",
	"The worst name for a reboot of a popular YA novel",
	"Now, where could my pipe be?",
	"If a lot of people ___, the world would be a better place to live.",
	"A lesson they should teach on Sesame Street",
	"Well, I hope we learned something today: ___.",
	"I always upvote ___.",
	"___?! Mother of God…",
	"What the everloving ___?!",
	"Best flavor of Sour Patch Candy",
	"Not throwing away my ___.",
	"Please, just don’t kill the ___.",
	"This is so sad, Alexa play ___.",
	"Do you know the ___, who lives on Drury Lane?",
	"Newest Spam flavor",
	"'This year we’ll be reading “The God of ___ Things.'",
	"Learn by ___, Learn by ___.",
	"The best tag for a fanfiction.",
	"Twitter thinks the hashtag ___ is about ___.",
	"God help and forgive me, I wanna ___.",
	"When I die I want ___.",
	"The worst pun you’ve ever heard:",
	"___ is dead, long live ___.",
	"Here comes the ___ with his ___. I’ll just take that and not the bread!",
	"Name of the next Disney movie:",
	"Mama, don’t let your babies grow up to be ___.",
	"Now, who could that be at this hour?",
	"Be ___. Be very ___.",
	"Let’s ___ and look for clues!",
	"Why were you late this morning?",
	"I crave the spicy flavor of ___.",
	"Somebody once told me that the world was gonna ___.",
	"It’s a simple ___ but quite unbreakable.",
	"What’s a question that always causes civil discourse?",
	"These ___ delights have ___ ends.",
	"The plot of the newest Twilight book",
	"Three ___. Two ___. One school.",
	"___: Game of the Year Edition",
	"College counseling told me that ___ was the most important thing in my college application.",
	"If I could go back in time, I’d ___.",
	"I’d sell my soul to the devil for ___.",
	"When Pandora opened the pithos, she let out every spirit but ___.",
	"Be rootin’, be tootin’, and by god, be ___.",
	"What if we kissed on the ___...",
	"A forgotten, unreleased Star Wars movie",
	"A really weird History Channel special",
	"___? No, I’m not really into Pokemon.",
	"Hey guys, I’m starting out as a conservative rapper and would love feedback on my lyrics: ___",
	"Things you can say about a baby but not a former US president",
	"Oh, you’re ___? Name every ___.",
	"For the last time, Karen, ___!",
	"I got up, walked to the door, and I saw it: ___",
	"If ___ is a crime, then lock me up.",
	"Well, well, well, if it isn’t ___.",
	"___ ASMR [relaxing]",
	"What if you wanted to ___, but ___?",
	"You know one thing that you just can’t see? You know you’re one bad day away from being ___.",
	"Sometimes, we just have to accept the hard truth: ___.",
	"'I am inevitable.' 'And I am ___.'",
	"I have been ___ for thirty minutes!",
	"The real reason humans are scared of the dark",
	"Anything but ___!",
	"No, Senator, you can’t ___.",
	"How to make someone instantly fall in love with you",
	"I knew Garfield had gone too far when ___.",
	"The worst Quiplash prompt you’ve ever had to answer",
	"The other four-letter word",
	"'You’re a ___ piece of ___.'",
];

//TODO: replace promptsUsed with array unusedPrompts
//	unusedPrompts starts as a copy of prompts, remove prompts as they are used
//	get rid of loopBreaker, randomize prompts from unusedPrompts
//	reset unusedPrompts if all prompts get used
module.exports = {
	getRandom: function(promptsUsed){
		let i = Math.floor(Math.random() * prompts.length);
		let loopBreaker = 0;
		while (promptsUsed.includes(prompts[i]) && loopBreaker < 200){
			i = Math.floor(Math.random() * prompts.length);
			loopBreaker++;
		}
		return(prompts[i]);
	}
}
