import Image from "next/image";
import { CaretDown, MapTrifold, Smiley, SkipForward } from "@/components/Icons";

type Message = {
  sendedAt: string;
  author: string;
  authorColor: "pink" | "green" | "blue" | "orange";
  message: string;
};

const mockMessages: Message[] = [
  {
    sendedAt: "14h52",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Incrível como ninguém ta zuando aqui, algum adm na sala?",
  },
  {
    sendedAt: "14h54",
    author: "theghostboy",
    authorColor: "green",
    message: "Sim, eu! Estou moderando essa sala pessoal",
  },
  {
    sendedAt: "14h55",
    author: "theghostboy",
    authorColor: "green",
    message: "A próxima vocês vão gostar",
  },
  {
    sendedAt: "14h57",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Essa é lendária",
  },
  {
    sendedAt: "14h57",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Não ouvia a tempos",
  },
  {
    sendedAt: "14h57",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Bom demais",
  },
  {
    sendedAt: "14h58",
    author: "AlexiaMands",
    authorColor: "pink",
    message: "Eu que adicionei essa",
  },
  {
    sendedAt: "15h00",
    author: "AlexiaMands",
    authorColor: "pink",
    message: "Saindo aqui, volto em breve galera!",
  },
  {
    sendedAt: "15h03",
    author: "theghostboy",
    authorColor: "green",
    message: "Bora por Metallica nessa playlist, please haha!",
  },
  {
    sendedAt: "15h10",
    author: "Keanu Reeves",
    authorColor: "blue",
    message: "Hi everyone!",
  },
  {
    sendedAt: "15h11",
    author: "theghostboy",
    authorColor: "green",
    message: "I can't believe it, are you Keanu?",
  },
  {
    sendedAt: "15h14",
    author: "Keanu Reeves",
    authorColor: "blue",
    message: "Yes, I'm here for true :)",
  },
  {
    sendedAt: "15h15",
    author: "Keanu Reeves",
    authorColor: "blue",
    message: "And wow, this sound is epic!",
  },
  {
    sendedAt: "15h19",
    author: "paiN Dynkas",
    authorColor: "orange",
    message: "Salve salve galera ✌️✌️",
  },
  {
    sendedAt: "15h21",
    author: "paiN Dynkas",
    authorColor: "orange",
    message: "Essa acho que vão gostar",
  },
  {
    sendedAt: "15h22",
    author: "theghostboy",
    authorColor: "green",
    message: "Agora sim, música boa 🔥",
  },
  {
    sendedAt: "15h23",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Essa é boa mesmo em",
  },
  {
    sendedAt: "15h23",
    author: "AlexiaMands",
    authorColor: "pink",
    message: "Muito legal mesmo, to de volta xD",
  },
  {
    sendedAt: "15h24",
    author: "Madrugadex",
    authorColor: "blue",
    message: "Boaa 🎉",
  },
];

export function Chat() {
  const authorColorsStyles = {
    pink: "text-pink-400",
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
  };

  return (
    <div className="flex w-80 flex-col gap-6 overflow-hidden rounded-xl bg-gray-800 shadow">
      <div className="flex h-24 items-center justify-between bg-gray-700 px-4 shadow">
        <button className="flex items-center p-2">
          <p className="text-sm font-semibold text-gray-100">
            Clássicos do Rock! 🤘
          </p>

          <CaretDown className="text-white" />
        </button>

        <button className="p-2 text-xl">
          <MapTrifold className="text-white" />
        </button>
      </div>
      <div
        id="chat"
        className="relative flex h-full max-h-full flex-col gap-2 overflow-hidden px-6"
      >
        {mockMessages.map(
          ({ sendedAt, author, authorColor, message }, index) => (
            <p key={index} className="leading-none">
              <text className="mr-1 text-xs text-gray-400">{sendedAt}</text>
              <text className="mr-1 text-xs text-gray-50">
                <strong className={authorColorsStyles[authorColor]}>
                  {author}
                </strong>
                :
              </text>
              <text className="text-xs text-gray-50">{message}</text>
            </p>
          )
        )}
      </div>
      <div className="relative px-6">
        <div className="flex h-10 w-full cursor-text items-center rounded-lg bg-gray-700 px-4 text-xs font-semibold text-gray-400 shadow">
          {"Type here your message :)"}
        </div>
        <button className="absolute right-6 top-[50%] translate-y-[-50%] rounded-lg bg-gray-700 p-3 transition-colors hover:bg-gray-600">
          <Smiley className="text-white" />
        </button>
      </div>
      <div className="bg-gray-700">
        <div className="h-1 w-full bg-gray-500">
          <div className="h-1 w-[65%] bg-indigo-600" />
        </div>

        <div className="flex items-center gap-3 p-6">
          <div className="h-10 w-10 overflow-hidden rounded-lg">
            <Image
              src="/smells_like_teen_spirit.jpg"
              width={40}
              height={40}
              alt="Nevermind album cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-sm font-semibold text-white">
              Smells Like Teen Spirit
            </p>
            <p className="text-xs text-gray-400">Nirvana • Nevermind</p>
          </div>
          <div className="text-xs text-gray-400">3:27/4:38</div>
        </div>
      </div>
    </div>
  );
}
