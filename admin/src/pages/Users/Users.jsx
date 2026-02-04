import React from 'react';

const Users = () => {
    //... other code

    const userData = sessionStorage.getItem('userData'); // line 29
    //... other code

    const userSettings = sessionStorage.getItem('userSettings'); // line 37
    //... other code

    const someValue = sessionStorage.getItem('someValue'); // line 54
    //... other code

    const anotherValue = sessionStorage.getItem('anotherValue'); // line 107
    //... other code
};

export default Users;