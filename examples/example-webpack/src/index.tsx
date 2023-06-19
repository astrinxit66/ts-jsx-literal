const MyCustomComponent = (props: { attr1: string, attr2: string[], attr3: boolean }) => {
    const {attr1, attr2, attr3} = props;

    return (
        <div>
            <span>These are my attributes:</span>
            <ul>
                <li>attr1:&nbsp;{attr1}</li>
                <li>attr2:&nbsp;{attr2.join(', ')}</li>
                <li>attr3:&nbsp;{attr3 ? 'true' : 'false'}</li>
            </ul>
        </div>
    );
}

const data = [
    {attr1: 'row1 attr1', attr2: ['row1 attr2 item1', 'row1 attr2 item2'], attr3: true},
    {attr1: 'row2 attr1', attr2: ['row2 attr2 item1', 'row2 attr2 item2'], attr3: false},
    {attr1: 'row3 attr1', attr2: ['row3 attr2 item1', 'row3 attr2 item2'], attr3: true},
];

document.body.innerHTML = (
    <>
        {data.map(({attr1, attr2, attr3}) => (
            <MyCustomComponent attr1={attr1} attr2={attr2} attr3={attr3}/>
        ))}
    </>
);