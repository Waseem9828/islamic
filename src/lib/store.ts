// This file is being deprecated and will be removed in a future step.
// All data is now being managed through Firebase.

interface Group {
  id: string;
  name: string;
  number: string;
  pastResults: { date: string; number: string }[];
}

interface User {
    id: string;
    email: string;
    subscriptions: string[]; // array of group ids
}

let store: {
  groups: Group[];
  users: User[];
} = {
  groups: [
    { 
        id: 'faridabad', 
        name: 'Faridabad', 
        number: '??', 
        pastResults: [
            { date: 'Yesterday', number: '45'},
            { date: 'Day before', number: '81'},
            { date: '2 days ago', number: '23'},
        ]
    },
    { 
        id: 'ghaziabad', 
        name: 'Ghaziabad', 
        number: '??', 
        pastResults: [
            { date: 'Yesterday', number: '12'},
            { date: 'Day before', number: '88'},
            { date: '2 days ago', number: '05'},
        ]
    },
    { 
        id: 'gali', 
        name: 'Gali', 
        number: '??', 
        pastResults: [
            { date: 'Yesterday', number: '99'},
            { date: 'Day before', number: '34'},
            { date: '2 days ago', number: '67'},
        ]
    },
    { 
        id: 'disawar', 
        name: 'Disawar', 
        number: '??', 
        pastResults: [
            { date: 'Yesterday', number: '52'},
            { date: 'Day before', number: '19'},
            { date: '2 days ago', number: '73'},
        ]
    },
  ],
  users: [
      {
          id: 'user123',
          email: 'user@example.com',
          subscriptions: ['faridabad', 'gali']
      }
  ]
};

export function getGroups() {
    return store.groups.map(g => ({ id: g.id, name: g.name }));
}

export function updateLuckyNumber(groupId: string, newNumber: string) {
  const group = store.groups.find(g => g.id === groupId);
  if (group) {
    group.pastResults.unshift({ date: 'Today', number: group.number });
    group.pastResults.pop();
    group.number = newNumber;
    group.pastResults[1].date = "Yesterday";
    group.pastResults[2].date = "Day before";
  }
}

export function getGroupData(groupId: string) {
    const group = store.groups.find(g => g.id === groupId);
    if (!group) return null;
    return JSON.parse(JSON.stringify(group));
}

export function isUserSubscribed(groupId: string, userId: string = 'user123') {
    const user = store.users.find(u => u.id === userId);
    return user ? user.subscriptions.includes(groupId) : false;
}

export function getSubscriptions() {
    return store.groups;
}
