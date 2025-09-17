
export async function Login(email:string, password: string) {
    if (email && password) {
    return {
        id: 1,
        email: 'testerafael@hotmail.com',
        token: 'teste-token'
    }
    }

}

export async function GetMyData(token:string) {
    if (token === 'teste-token') {
    return {
        id: 1,
        email: 'testerafael@hotmail.com',
        name: 'Rafael Teste',
        companyName: 'Empresa Teste S/A',
        document: '06473846980',
        number: '9999999999999999',
        birthDate: '1989-12-18T14:21:08.000Z',
        activationAt: '2024-08-22T14:21:08.000Z',
        validAt: '2027-02-22T14:21:08.000Z',
        token: 'teste-token'
    }
    }
}