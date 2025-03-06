using System.Net.WebSockets;
using System.Text;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5000");
var app = builder.Build();

app.UseWebSockets();
var clients = new ConcurrentDictionary<WebSocket, string>();

app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var userName = context.Request.Query["name"];
        if (string.IsNullOrEmpty(userName))
        {
            context.Response.StatusCode = 400;
            return;
        }

        var ws = await context.WebSockets.AcceptWebSocketAsync();
        clients.TryAdd(ws, userName);
        Console.WriteLine($"{userName} joined the chat.");

        await BroadcastMessage($"{userName} joined the chat. Users online: {clients.Count}");

        try
        {
            await ReceiveMessages(ws, userName);
        }
        finally
        {
            clients.TryRemove(ws, out _);
            Console.WriteLine($"{userName} left the chat.");
            await BroadcastMessage($"{userName} left the chat. Users online: {clients.Count}");
        }
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

async Task ReceiveMessages(WebSocket ws, string userName)
{
    var buffer = new byte[1024 * 4];
    while (ws.State == WebSocketState.Open)
    {
        var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        if (result.MessageType == WebSocketMessageType.Text)
        {
            string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
            await BroadcastMessage($"{userName}: {message}");
        }
        else if (result.MessageType == WebSocketMessageType.Close)
        {
            break;
        }
    }
}

async Task BroadcastMessage(string message)
{
    var bytes = Encoding.UTF8.GetBytes(message);
    foreach (var client in clients.Keys)
    {
        if (client.State == WebSocketState.Open)
        {
            await client.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }
}

app.Run();
